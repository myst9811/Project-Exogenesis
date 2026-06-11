/**
 * @module physics/orbital/index.test
 */

import { describe, expect, it } from 'vitest';

import { ASTRONOMICAL_UNIT_AU, SECONDS_PER_DAY, SOLAR_MASS_KILOGRAMS } from '../constants';
import { PhysicsRangeError } from '../errors';
import { computeOrbitalPeriod } from './index';

describe('computeOrbitalPeriod', () => {
  it('produces ~365.25 days for Earth (1 AU around 1 M☉)', () => {
    const result = computeOrbitalPeriod(ASTRONOMICAL_UNIT_AU, SOLAR_MASS_KILOGRAMS);
    expect(result / SECONDS_PER_DAY).toBeCloseTo(365.25, 0);
  });

  it('produces ~687 days for Mars (1.524 AU)', () => {
    const result = computeOrbitalPeriod(1.524 * ASTRONOMICAL_UNIT_AU, SOLAR_MASS_KILOGRAMS);
    expect(result / SECONDS_PER_DAY).toBeCloseTo(687, 0);
  });

  it('produces ~0.837 days for Kepler-10b (Dumusque et al. 2014: a = 0.01685 AU, M★ = 0.910 M☉)', () => {
    const result = computeOrbitalPeriod(
      0.01685 * ASTRONOMICAL_UNIT_AU,
      0.91 * SOLAR_MASS_KILOGRAMS,
    );
    expect(result / SECONDS_PER_DAY).toBeCloseTo(0.837, 2);
  });

  it('follows Kepler scaling: T² ∝ a³', () => {
    const inner = computeOrbitalPeriod(ASTRONOMICAL_UNIT_AU, SOLAR_MASS_KILOGRAMS);
    const outer = computeOrbitalPeriod(4 * ASTRONOMICAL_UNIT_AU, SOLAR_MASS_KILOGRAMS);
    expect(outer).toBeCloseTo(8 * inner, 3);
  });

  it('throws PhysicsRangeError for zero semi-major axis', () => {
    expect(() => computeOrbitalPeriod(0, SOLAR_MASS_KILOGRAMS)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for non-finite semi-major axis', () => {
    expect(() => computeOrbitalPeriod(Number.NaN, SOLAR_MASS_KILOGRAMS)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError for negative stellar mass', () => {
    expect(() => computeOrbitalPeriod(ASTRONOMICAL_UNIT_AU, -1)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for non-finite stellar mass', () => {
    expect(() => computeOrbitalPeriod(ASTRONOMICAL_UNIT_AU, Infinity)).toThrow(PhysicsRangeError);
  });
});
