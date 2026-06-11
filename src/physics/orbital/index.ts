/**
 * @module physics/orbital
 *
 * Keplerian orbital mechanics.
 *
 * Models implemented:
 *   - Orbital period from Kepler's third law
 *
 * Assumptions:
 *   - Two-body problem; planet mass negligible against stellar mass
 *
 * Future work:
 *   - Orbital resonances (multi-planet systems)
 *   - Tidal locking timescale (Goldreich-Soter criterion)
 */

import { GRAVITATIONAL_CONSTANT_G } from '../constants';
import { PhysicsRangeError } from '../errors';

/**
 * Computes the orbital period from Kepler's third law.
 *
 * Equation: T = 2π · √(a³ / (G · M_star))
 *
 * Assumptions:
 *   - Planet mass is negligible relative to the star (M_p ≪ M_star)
 *   - Closed two-body Keplerian orbit; period depends only on the
 *     semi-major axis, not on eccentricity
 *
 * Simplifications:
 *   - No relativistic correction (negligible outside ~0.05 AU of
 *     compact massive stars)
 *
 * Domain: Bound orbits around a single star.
 *
 * @param semiMajorAxisMeters - Orbital semi-major axis in meters
 * @param stellarMassKilograms - Host star mass in kilograms
 * @returns Orbital period in seconds
 */
export function computeOrbitalPeriod(
  semiMajorAxisMeters: number,
  stellarMassKilograms: number,
): number {
  if (!Number.isFinite(semiMajorAxisMeters) || semiMajorAxisMeters <= 0) {
    throw new PhysicsRangeError('semiMajorAxisMeters', semiMajorAxisMeters, [0, Infinity], 'm');
  }
  if (!Number.isFinite(stellarMassKilograms) || stellarMassKilograms <= 0) {
    throw new PhysicsRangeError(
      'stellarMassKilograms',
      stellarMassKilograms,
      [0, Infinity],
      'kg',
    );
  }
  return (
    2 *
    Math.PI *
    Math.sqrt(semiMajorAxisMeters ** 3 / (GRAVITATIONAL_CONSTANT_G * stellarMassKilograms))
  );
}
