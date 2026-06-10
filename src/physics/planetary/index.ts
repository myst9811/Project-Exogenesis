/**
 * @module physics/planetary
 *
 * Planetary bulk properties: mass, radius, density, internal structure.
 *
 * Models implemented:
 *   - Bulk density from total mass and mean radius (uniform sphere)
 *
 * Future work (Phase 2):
 *   - Surface gravity
 *   - Escape velocity
 *   - Internal structure classes
 */

import { PhysicsRangeError } from '../errors';

/**
 * Computes bulk (mean) density of a planet treated as a sphere.
 *
 * Equation: ρ = M / ((4/3) · π · R³)
 *
 * Assumptions:
 *   - The body is spherical (hydrostatic equilibrium)
 *   - Radius is the mean volumetric radius
 *
 * Simplifications:
 *   - No oblateness correction
 *   - No distinction between equatorial and polar radius
 *
 * Domain: Valid for any body with positive mass and radius.
 *
 * @param massKilograms - Total planetary mass in kilograms
 * @param radiusMeters - Mean planetary radius in meters
 * @returns Bulk density in kilograms per cubic meter
 */
export function computeBulkDensity(massKilograms: number, radiusMeters: number): number {
  if (!Number.isFinite(massKilograms) || massKilograms <= 0) {
    throw new PhysicsRangeError('massKilograms', massKilograms, [0, Infinity], 'kg');
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new PhysicsRangeError('radiusMeters', radiusMeters, [0, Infinity], 'm');
  }
  return massKilograms / ((4 / 3) * Math.PI * radiusMeters ** 3);
}
