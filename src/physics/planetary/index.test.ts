/**
 * @module physics/planetary/index.test
 */

import { describe, expect, it } from 'vitest';

import {
  EARTH_MASS_KILOGRAMS,
  EARTH_EQUATORIAL_RADIUS_METERS,
  JUPITER_MASS_KILOGRAMS,
} from '../constants';
import { PhysicsRangeError } from '../errors';
import { computeBulkDensity, computeEscapeVelocity, computeSurfaceGravity } from './index';

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

describe('computeSurfaceGravity', () => {
  it('produces ~9.82 m/s² for Earth (mass and mean volumetric radius)', () => {
    const result = computeSurfaceGravity(EARTH_MASS_KILOGRAMS, EARTH_MEAN_RADIUS_METERS);
    expect(result).toBeCloseTo(9.82, 1);
  });

  it('produces ~15 m/s² for Kepler-10b (3.33 M⊕, 1.47 R⊕)', () => {
    const result = computeSurfaceGravity(
      3.33 * EARTH_MASS_KILOGRAMS,
      1.47 * EARTH_EQUATORIAL_RADIUS_METERS,
    );
    expect(result).toBeCloseTo(15.1, 0);
  });

  it('scales with the inverse square of radius', () => {
    const base = computeSurfaceGravity(EARTH_MASS_KILOGRAMS, EARTH_MEAN_RADIUS_METERS);
    const doubled = computeSurfaceGravity(EARTH_MASS_KILOGRAMS, 2 * EARTH_MEAN_RADIUS_METERS);
    expect(doubled).toBeCloseTo(base / 4, 5);
  });

  it('throws PhysicsRangeError when mass is non-positive or non-finite', () => {
    expect(() => computeSurfaceGravity(0, EARTH_MEAN_RADIUS_METERS)).toThrow(PhysicsRangeError);
    expect(() => computeSurfaceGravity(Number.NaN, EARTH_MEAN_RADIUS_METERS)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError when radius is non-positive or non-finite', () => {
    expect(() => computeSurfaceGravity(EARTH_MASS_KILOGRAMS, 0)).toThrow(PhysicsRangeError);
    expect(() => computeSurfaceGravity(EARTH_MASS_KILOGRAMS, Infinity)).toThrow(
      PhysicsRangeError,
    );
  });
});

describe('computeEscapeVelocity', () => {
  it('produces ~11.19 km/s for Earth', () => {
    const result = computeEscapeVelocity(EARTH_MASS_KILOGRAMS, EARTH_MEAN_RADIUS_METERS);
    expect(result / 1000).toBeCloseTo(11.19, 1);
  });

  it('produces ~59.5 km/s for Jupiter (NASA fact sheet, equatorial radius)', () => {
    // NASA Jupiter fact sheet: equatorial radius 71,492 km, v_esc 59.5 km/s.
    const result = computeEscapeVelocity(JUPITER_MASS_KILOGRAMS, 7.1492e7);
    expect(result / 1000).toBeCloseTo(59.5, 0);
  });

  it('scales with the square root of mass', () => {
    const base = computeEscapeVelocity(EARTH_MASS_KILOGRAMS, EARTH_MEAN_RADIUS_METERS);
    const quadrupled = computeEscapeVelocity(4 * EARTH_MASS_KILOGRAMS, EARTH_MEAN_RADIUS_METERS);
    expect(quadrupled).toBeCloseTo(2 * base, 4);
  });

  it('throws PhysicsRangeError when mass is non-positive or non-finite', () => {
    expect(() => computeEscapeVelocity(-1, EARTH_MEAN_RADIUS_METERS)).toThrow(PhysicsRangeError);
    expect(() => computeEscapeVelocity(Infinity, EARTH_MEAN_RADIUS_METERS)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError when radius is non-positive or non-finite', () => {
    expect(() => computeEscapeVelocity(EARTH_MASS_KILOGRAMS, -1)).toThrow(PhysicsRangeError);
    expect(() => computeEscapeVelocity(EARTH_MASS_KILOGRAMS, Number.NaN)).toThrow(
      PhysicsRangeError,
    );
  });
});
