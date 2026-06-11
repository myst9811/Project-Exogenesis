/**
 * @module physics/index.test
 *
 * End-to-end engine tests: validated configuration → complete PlanetaryState.
 */

import { describe, expect, it } from 'vitest';

import type { ConfigurationManifest } from '../types/configuration';
import type { PlanetConfiguration } from '../types/configuration';
import { PLANETARY_STATE_SCHEMA_VERSION } from '../types/physics';
import { ASTRONOMICAL_UNIT_AU, SECONDS_PER_DAY } from './constants';
import { createEarthBaselineConfiguration } from './configuration/earthBaseline';
import { buildConfigurationManifest } from './configuration/manifest';
import { computePlanetaryState } from './index';

async function manifestFor(configuration: PlanetConfiguration): Promise<ConfigurationManifest> {
  const result = await buildConfigurationManifest(configuration);
  if (!result.ok) {
    throw new Error('test fixture configuration failed validation');
  }
  return result.manifest;
}

describe('computePlanetaryState', () => {
  it('reproduces Earth end-to-end from the baseline configuration', async () => {
    const manifest = await manifestFor(createEarthBaselineConfiguration());
    const state = computePlanetaryState(manifest);

    expect(state.schemaVersion).toBe(PLANETARY_STATE_SCHEMA_VERSION);
    expect(state.configurationHash).toBe(manifest.hash);

    // Orbit: one sidereal year.
    expect(state.orbit.orbitalPeriodSeconds / SECONDS_PER_DAY).toBeCloseTo(365.25, 0);

    // Bulk: NASA fact sheet values (equatorial radius convention).
    expect(state.bulk.surfaceGravityMetersPerSecondSquared).toBeCloseTo(9.8, 1);
    expect(state.bulk.escapeVelocityMetersPerSecond / 1000).toBeCloseTo(11.18, 1);
    expect(state.bulk.bulkDensityKilogramsPerCubicMeter).toBeCloseTo(5495, 0);

    // Climate: bare-rock 254 K, greenhouse-adjusted 288 K.
    expect(state.climate.bondAlbedo).toBeCloseTo(0.306, 3);
    expect(state.climate.equilibriumTemperatureKelvin).toBeCloseTo(254, 0);
    expect(state.climate.surfaceTemperatureKelvin).toBeCloseTo(288, 0);

    // Atmosphere: moist-air molar mass, ~8.5 km scale height, N₂/O₂ retained.
    expect(state.atmosphere.surfacePressureKilopascals).toBeCloseTo(101.3, 1);
    expect((state.atmosphere.meanMolarMassKilogramsPerMole ?? 0) * 1000).toBeCloseTo(28.8, 1);
    expect((state.atmosphere.scaleHeightMeters ?? 0) / 1000).toBeCloseTo(8.5, 0);
    const retentionByGas = new Map(
      state.atmosphere.gasRetention.map((entry) => [entry.gas, entry.classification]),
    );
    expect(retentionByGas.get('N2')).toBe('retained');
    expect(retentionByGas.get('O2')).toBe('retained');

    // Habitable zone: 1 AU sits inside the conservative zone.
    expect(state.habitableZone).not.toBeNull();
    expect(state.habitableZone?.position).toBe('inside-conservative');
    expect((state.habitableZone?.conservativeInnerEdgeMeters ?? 0) / ASTRONOMICAL_UNIT_AU)
      .toBeCloseTo(0.96, 1);
    expect((state.habitableZone?.conservativeOuterEdgeMeters ?? 0) / ASTRONOMICAL_UNIT_AU)
      .toBeCloseTo(1.7, 1);
  });

  it('handles an airless world: null atmospheric structure, surface at equilibrium temperature', async () => {
    const configuration = createEarthBaselineConfiguration();
    configuration.atmosphere.partialPressuresKilopascals = {};
    const state = computePlanetaryState(await manifestFor(configuration));

    expect(state.atmosphere.surfacePressureKilopascals).toBe(0);
    expect(state.atmosphere.meanMolarMassKilogramsPerMole).toBeNull();
    expect(state.atmosphere.scaleHeightMeters).toBeNull();
    expect(state.atmosphere.gasRetention).toEqual([]);
    expect(state.climate.greenhouseOpticalDepth).toBe(0);
    expect(state.climate.surfaceTemperatureKelvin).toBe(
      state.climate.equilibriumTemperatureKelvin,
    );
  });

  it('returns a null habitable zone for a star hotter than the Kopparapu domain', async () => {
    const configuration = createEarthBaselineConfiguration();
    configuration.stellar = { spectralClass: 'B', massSolarMasses: 2.2, ageGigayears: 0.1 };
    const state = computePlanetaryState(await manifestFor(configuration));

    expect(state.stellar.effectiveTemperatureKelvin).toBeGreaterThan(7200);
    expect(state.habitableZone).toBeNull();
  });

  it('produces deeply frozen state at every boundary', async () => {
    const state = computePlanetaryState(await manifestFor(createEarthBaselineConfiguration()));
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.stellar)).toBe(true);
    expect(Object.isFrozen(state.orbit)).toBe(true);
    expect(Object.isFrozen(state.bulk)).toBe(true);
    expect(Object.isFrozen(state.atmosphere)).toBe(true);
    expect(Object.isFrozen(state.atmosphere.gasRetention)).toBe(true);
    expect(Object.isFrozen(state.climate)).toBe(true);
    expect(Object.isFrozen(state.habitableZone)).toBe(true);
  });

  it('is deterministic: identical manifests produce identical states', async () => {
    const manifest = await manifestFor(createEarthBaselineConfiguration());
    expect(computePlanetaryState(manifest)).toEqual(computePlanetaryState(manifest));
  });
});
