/**
 * @module physics/planetary/index.test
 */

import { describe, expect, it } from 'vitest';

import { EARTH_MASS_KILOGRAMS, EARTH_EQUATORIAL_RADIUS_METERS } from '../constants';
import { PhysicsRangeError } from '../errors';
import { computeBulkDensity } from './index';

/** Earth volumetric mean radius. Source: IUGG / NASA Earth fact sheet. */
const EARTH_MEAN_RADIUS_METERS = 6.371e6;

describe('computeBulkDensity', () => {
  it('produces ~5514 kg/m³ for Earth (mass and mean volumetric radius)', () => {
    const result = computeBulkDensity(EARTH_MASS_KILOGRAMS, EARTH_MEAN_RADIUS_METERS);
    expect(result).toBeCloseTo(5514, -1); // ±5 kg/m³ of NASA fact sheet value
  });

  it('produces ~5800 kg/m³ for Kepler-10b (Dumusque et al. 2014: 3.33 M⊕, 1.47 R⊕)', () => {
    const result = computeBulkDensity(
      3.33 * EARTH_MASS_KILOGRAMS,
      1.47 * EARTH_EQUATORIAL_RADIUS_METERS,
    );
    // Published bulk density: 5.8 ± 0.8 g/cm³
    expect(result).toBeGreaterThan(5000);
    expect(result).toBeLessThan(6600);
  });

  it('scales with the inverse cube of radius', () => {
    const base = computeBulkDensity(EARTH_MASS_KILOGRAMS, EARTH_MEAN_RADIUS_METERS);
    const doubled = computeBulkDensity(EARTH_MASS_KILOGRAMS, 2 * EARTH_MEAN_RADIUS_METERS);
    expect(doubled).toBeCloseTo(base / 8, 5);
  });

  it('throws PhysicsRangeError when mass is zero', () => {
    expect(() => computeBulkDensity(0, EARTH_MEAN_RADIUS_METERS)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError when mass is not finite', () => {
    expect(() => computeBulkDensity(Number.NaN, EARTH_MEAN_RADIUS_METERS)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError when radius is negative', () => {
    expect(() => computeBulkDensity(EARTH_MASS_KILOGRAMS, -1)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError when radius is not finite', () => {
    expect(() => computeBulkDensity(EARTH_MASS_KILOGRAMS, Infinity)).toThrow(PhysicsRangeError);
  });
});
