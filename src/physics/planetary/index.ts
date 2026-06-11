/**
 * @module physics/planetary
 *
 * Planetary bulk properties: mass, radius, density, internal structure.
 *
 * Models implemented:
 *   - Bulk density from total mass and mean radius (uniform sphere)
 *   - Surface gravity from Newtonian gravitation
 *   - Escape velocity from energy conservation
 *
 * Future work:
 *   - Internal structure classes (core/mantle differentiation)
 */

import { GRAVITATIONAL_CONSTANT_G } from '../constants';
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

/**
 * Computes surface gravitational acceleration.
 *
 * Equation: g = G · M / R²
 *
 * Assumptions:
 *   - Spherically symmetric mass distribution (shell theorem applies)
 *
 * Simplifications:
 *   - No rotational (centrifugal) correction — Earth's is ~0.3%
 *
 * Domain: Valid for any body with positive mass and radius.
 *
 * @param massKilograms - Total planetary mass in kilograms
 * @param radiusMeters - Mean planetary radius in meters
 * @returns Surface gravitational acceleration in m/s²
 */
export function computeSurfaceGravity(massKilograms: number, radiusMeters: number): number {
  if (!Number.isFinite(massKilograms) || massKilograms <= 0) {
    throw new PhysicsRangeError('massKilograms', massKilograms, [0, Infinity], 'kg');
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new PhysicsRangeError('radiusMeters', radiusMeters, [0, Infinity], 'm');
  }
  return (GRAVITATIONAL_CONSTANT_G * massKilograms) / radiusMeters ** 2;
}

/**
 * Computes surface escape velocity.
 *
 * Equation: v_esc = √(2 · G · M / R)
 *
 * Assumptions:
 *   - Launch from the surface radius, ignoring atmospheric drag
 *   - Non-rotating body (no rotational assist)
 *
 * Domain: Valid for any body with positive mass and radius.
 *
 * @param massKilograms - Total planetary mass in kilograms
 * @param radiusMeters - Mean planetary radius in meters
 * @returns Escape velocity in m/s
 */
export function computeEscapeVelocity(massKilograms: number, radiusMeters: number): number {
  if (!Number.isFinite(massKilograms) || massKilograms <= 0) {
    throw new PhysicsRangeError('massKilograms', massKilograms, [0, Infinity], 'kg');
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new PhysicsRangeError('radiusMeters', radiusMeters, [0, Infinity], 'm');
  }
  return Math.sqrt((2 * GRAVITATIONAL_CONSTANT_G * massKilograms) / radiusMeters);
}
