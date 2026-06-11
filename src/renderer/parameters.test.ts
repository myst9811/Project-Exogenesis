/**
 * @module renderer/parameters.test
 */

import { describe, expect, it } from 'vitest';

import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import { hashConfiguration } from '../physics/configuration/manifest';
import { computePlanetaryState } from '../physics';
import type { PlanetConfiguration } from '../types/configuration';
import type { PlanetaryState } from '../types/physics';
import { deriveRenderParameters } from './parameters';

async function stateFor(
  mutate: (configuration: PlanetConfiguration) => void = () => undefined,
): Promise<PlanetaryState> {
  const configuration = createEarthBaselineConfiguration();
  mutate(configuration);
  const manifest = await hashConfiguration(configuration);
  return computePlanetaryState(manifest);
}

describe('deriveRenderParameters', () => {
  it('derives a coherent Earth appearance from real computed state', async () => {
    const params = deriveRenderParameters(await stateFor());

    // Sun-like star: warm-white, with a small but positive apparent size.
    expect(params.star.colorRgb.r).toBeGreaterThan(0.8);
    expect(params.star.angularRadiusRadians).toBeGreaterThan(0);

    // Rocky surface: warm (red ≥ blue).
    expect(params.planet.surfaceColorRgb.r).toBeGreaterThan(params.planet.surfaceColorRgb.b);

    // Earth-like atmosphere present, translucent, with a blue sky.
    expect(params.atmosphere.present).toBe(true);
    expect(params.atmosphere.opacity).toBeGreaterThan(0.5);
    expect(params.atmosphere.skyColorRgb.b).toBeGreaterThan(params.atmosphere.skyColorRgb.r);
  });

  it('reports no atmosphere for an airless world', async () => {
    const params = deriveRenderParameters(
      await stateFor((c) => {
        c.atmosphere.partialPressuresKilopascals = {};
      }),
    );
    expect(params.atmosphere.present).toBe(false);
  });

  it('is deterministic for identical state', async () => {
    const state = await stateFor();
    expect(deriveRenderParameters(state)).toEqual(deriveRenderParameters(state));
  });
});
