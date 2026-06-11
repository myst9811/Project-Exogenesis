/**
 * @module ai/context.test
 */

import { describe, expect, it } from 'vitest';

import { assessHabitability } from '../physics/habitability';
import { hashConfiguration } from '../physics/configuration/manifest';
import { computePlanetaryState } from '../physics';
import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import type { PlanetaryState } from '../types/physics';
import { buildPlanetaryContext } from './context';

async function earthState(): Promise<PlanetaryState> {
  const manifest = await hashConfiguration(createEarthBaselineConfiguration());
  return computePlanetaryState(manifest);
}

describe('buildPlanetaryContext', () => {
  it('serializes the computed branches as parseable JSON with unit-suffixed keys', async () => {
    const json = buildPlanetaryContext(await earthState());
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed.star).toBeDefined();
    expect(parsed.orbit).toBeDefined();
    expect(parsed.planet).toBeDefined();
    expect(parsed.climate).toBeDefined();
    expect(parsed.habitableZone).toBeDefined();
    // Unit-suffixed keys survive verbatim so the model sees units.
    expect(json).toContain('surfaceTemperatureKelvin');
    expect(json).toContain('surfaceGravityMetersPerSecondSquared');
  });

  it('omits habitability when not provided and includes it when provided', async () => {
    const state = await earthState();
    expect(buildPlanetaryContext(state)).not.toContain('"habitability"');

    const withHab = buildPlanetaryContext(state, assessHabitability(state));
    expect(withHab).toContain('"habitability"');
    expect(withHab).toContain('human-baseline');
  });

  it('does not invent values — every number is present in the source state', async () => {
    const state = await earthState();
    const parsed = JSON.parse(buildPlanetaryContext(state)) as {
      climate: { surfaceTemperatureKelvin: number };
    };
    expect(parsed.climate.surfaceTemperatureKelvin).toBe(
      state.climate.surfaceTemperatureKelvin,
    );
  });
});
