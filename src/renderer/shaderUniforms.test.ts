/**
 * @module renderer/shaderUniforms.test
 */

import { describe, expect, it } from 'vitest';

import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import { hashConfiguration } from '../physics/configuration/manifest';
import { computePlanetaryState } from '../physics';
import { assessHabitability } from '../physics/habitability';
import type { PlanetConfiguration } from '../types/configuration';
import type { PlanetaryState } from '../types/physics';
import {
  deriveCloudDensity,
  deriveIceFraction,
  deriveMoltenFactor,
  deriveOceanLevel,
  deriveShaderUniforms,
  deriveSpin,
  deriveTerrainSeed,
} from './shaderUniforms';

async function worldFor(
  mutate: (c: PlanetConfiguration) => void = () => undefined,
): Promise<PlanetaryState> {
  const config = createEarthBaselineConfiguration();
  mutate(config);
  return computePlanetaryState(await hashConfiguration(config));
}

describe('deriveIceFraction', () => {
  it('is a small cap for Earth (288 K)', () => {
    expect(deriveIceFraction(288)).toBeCloseTo(0.2, 2);
  });
  it('is a full snowball at/below 240 K', () => {
    expect(deriveIceFraction(240)).toBe(1);
    expect(deriveIceFraction(150)).toBe(1);
  });
  it('is none at/above 300 K', () => {
    expect(deriveIceFraction(300)).toBe(0);
    expect(deriveIceFraction(500)).toBe(0);
  });
});

describe('deriveMoltenFactor', () => {
  it('is zero for temperate and Venus-like worlds', () => {
    expect(deriveMoltenFactor(288)).toBe(0);
    expect(deriveMoltenFactor(737)).toBe(0);
  });
  it('ramps from 1000 K to full glow at 1400 K', () => {
    expect(deriveMoltenFactor(1200)).toBeCloseTo(0.5, 2);
    expect(deriveMoltenFactor(1400)).toBe(1);
    expect(deriveMoltenFactor(2000)).toBe(1);
  });
});

describe('deriveOceanLevel', () => {
  it('floods a water-world regardless', () => {
    expect(deriveOceanLevel('water-world', false, 0)).toBe(0.85);
  });
  it('gives Earth-like coverage when liquid water is possible and water is present', () => {
    expect(deriveOceanLevel('rocky-silicate', true, 1.3)).toBe(0.5);
  });
  it('gives no oceans without liquid water or without water', () => {
    expect(deriveOceanLevel('rocky-silicate', false, 1.3)).toBe(0);
    expect(deriveOceanLevel('rocky-silicate', true, 0)).toBe(0);
  });
});

describe('deriveCloudDensity', () => {
  it('produces moderate cloud for Earth (1.3 kPa H2O, 101 kPa total)', () => {
    expect(deriveCloudDensity(1.3, 101)).toBeGreaterThan(0.4);
    expect(deriveCloudDensity(1.3, 101)).toBeLessThan(0.7);
  });
  it('is zero when dry or airless', () => {
    expect(deriveCloudDensity(0, 101)).toBe(0);
    expect(deriveCloudDensity(1.3, 0)).toBe(0);
  });
});

describe('deriveSpin', () => {
  it('spins Earth (24 h) at ~0.105 rad/s', () => {
    expect(deriveSpin(24)).toBeCloseTo(0.105, 2);
  });
  it('spins faster for a short day', () => {
    expect(Math.abs(deriveSpin(6))).toBeGreaterThan(Math.abs(deriveSpin(24)));
  });
  it('reverses direction for retrograde rotation', () => {
    expect(deriveSpin(-24)).toBeLessThan(0);
  });
  it('treats a zero period as a 24 h day rather than dividing by zero', () => {
    expect(deriveSpin(0)).toBeCloseTo(deriveSpin(24), 5);
  });
});

describe('deriveTerrainSeed', () => {
  it('is deterministic for a given hash', () => {
    expect(deriveTerrainSeed('36b20d11ff')).toBe(deriveTerrainSeed('36b20d11ff'));
  });
  it('differs for different hashes', () => {
    expect(deriveTerrainSeed('aaaaaaaa')).not.toBe(deriveTerrainSeed('bbbbbbbb'));
  });
});

describe('deriveShaderUniforms', () => {
  it('gives Earth oceans, modest ice, clouds, and a present atmosphere', async () => {
    const world = await worldFor();
    const u = deriveShaderUniforms(world, assessHabitability(world).liquidWater);
    expect(u.oceanLevel).toBeGreaterThan(0);
    expect(u.iceFraction).toBeGreaterThan(0);
    expect(u.iceFraction).toBeLessThan(0.5);
    expect(u.cloudDensity).toBeGreaterThan(0);
    expect(u.atmospherePresent).toBe(true);
    expect(u.starAngularRadius).toBeGreaterThan(0);
  });

  it('gives an airless world no clouds and no atmosphere', async () => {
    const world = await worldFor((c) => {
      c.atmosphere.partialPressuresKilopascals = {};
    });
    const u = deriveShaderUniforms(world, assessHabitability(world).liquidWater);
    expect(u.cloudDensity).toBe(0);
    expect(u.atmospherePresent).toBe(false);
    expect(u.oceanLevel).toBe(0);
  });

  it('is deterministic and matches the configuration hash for the terrain seed', async () => {
    const world = await worldFor();
    const water = assessHabitability(world).liquidWater;
    expect(deriveShaderUniforms(world, water)).toEqual(deriveShaderUniforms(world, water));
    expect(deriveShaderUniforms(world, water).terrainSeed).toBe(
      deriveTerrainSeed(world.configurationHash),
    );
  });
});
