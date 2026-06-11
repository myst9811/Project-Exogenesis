/**
 * @module physics/stellar
 *
 * Main-sequence stellar properties derived from stellar mass.
 *
 * Models implemented:
 *   - Empirical mass–luminosity relation (piecewise power laws)
 *   - Empirical mass–radius relation (piecewise power laws)
 *   - Effective temperature from the Stefan–Boltzmann law
 *
 * Assumptions:
 *   - The star is on the main sequence (hydrogen burning, stable)
 *   - Solar-metallicity calibrations
 *
 * Future work:
 *   - Age-dependent luminosity evolution
 *   - Stellar spectrum beyond blackbody
 */

import {
  HYDROGEN_BURNING_MINIMUM_MASS_SOLAR_MASSES,
  MAXIMUM_STELLAR_MASS_SOLAR_MASSES,
  NOMINAL_SOLAR_LUMINOSITY_L_SUN,
  NOMINAL_SOLAR_RADIUS_R_SUN,
  SOLAR_MASS_KILOGRAMS,
  STEFAN_BOLTZMANN_CONSTANT_SIGMA,
} from '../constants';
import { PhysicsRangeError } from '../errors';

/** Valid stellar mass range in kilograms, for boundary validation. */
const STELLAR_MASS_RANGE_KILOGRAMS: readonly [number, number] = [
  HYDROGEN_BURNING_MINIMUM_MASS_SOLAR_MASSES * SOLAR_MASS_KILOGRAMS,
  MAXIMUM_STELLAR_MASS_SOLAR_MASSES * SOLAR_MASS_KILOGRAMS,
];

function assertStellarMassInRange(massKilograms: number): void {
  if (
    !Number.isFinite(massKilograms) ||
    massKilograms < STELLAR_MASS_RANGE_KILOGRAMS[0] ||
    massKilograms > STELLAR_MASS_RANGE_KILOGRAMS[1]
  ) {
    throw new PhysicsRangeError('massKilograms', massKilograms, STELLAR_MASS_RANGE_KILOGRAMS, 'kg');
  }
}

/**
 * Estimates main-sequence luminosity from stellar mass.
 *
 * Equation (piecewise, M and L in solar units):
 *   L = 0.23 · M^2.3   for M < 0.43
 *   L = M^4            for 0.43 ≤ M < 2
 *   L = 1.4 · M^3.5    for 2 ≤ M < 55
 *   L = 32000 · M      for M ≥ 55
 *
 * Assumptions:
 *   - Zero-age main sequence; no luminosity evolution with age
 *
 * Simplifications:
 *   - Empirical fit with ~10–20% scatter against observed binaries;
 *     small discontinuities exist at the branch boundaries
 *
 * Domain: Main-sequence stars, 0.075–150 M☉.
 *
 * @param massKilograms - Stellar mass in kilograms
 * @returns Luminosity in watts
 *
 * @see Duric (2004), Advanced Astrophysics, §1.3 — ESTIMATE: empirical relation
 */
export function estimateMainSequenceLuminosity(massKilograms: number): number {
  assertStellarMassInRange(massKilograms);
  const massSolar = massKilograms / SOLAR_MASS_KILOGRAMS;
  let luminositySolar: number;
  if (massSolar < 0.43) {
    luminositySolar = 0.23 * massSolar ** 2.3;
  } else if (massSolar < 2) {
    luminositySolar = massSolar ** 4;
  } else if (massSolar < 55) {
    luminositySolar = 1.4 * massSolar ** 3.5;
  } else {
    luminositySolar = 32_000 * massSolar;
  }
  return luminositySolar * NOMINAL_SOLAR_LUMINOSITY_L_SUN;
}

/**
 * Estimates main-sequence radius from stellar mass.
 *
 * Equation (piecewise, M and R in solar units):
 *   R = 1.06 · M^0.945   for M < 1.66
 *   R = 1.33 · M^0.555   for M ≥ 1.66
 *
 * Assumptions:
 *   - Main-sequence stars of roughly solar metallicity
 *
 * Simplifications:
 *   - Empirical fit; predicts 1.06 R☉ for the Sun (~6% high), within
 *     the relation's observed scatter
 *
 * Domain: Main-sequence stars, 0.075–150 M☉.
 *
 * @param massKilograms - Stellar mass in kilograms
 * @returns Stellar radius in meters
 *
 * @see Demircan & Kahraman (1991), Ap&SS 181, 313 — ESTIMATE: empirical relation
 */
export function estimateMainSequenceRadius(massKilograms: number): number {
  assertStellarMassInRange(massKilograms);
  const massSolar = massKilograms / SOLAR_MASS_KILOGRAMS;
  const radiusSolar = massSolar < 1.66 ? 1.06 * massSolar ** 0.945 : 1.33 * massSolar ** 0.555;
  return radiusSolar * NOMINAL_SOLAR_RADIUS_R_SUN;
}

/**
 * Computes effective (photospheric blackbody) temperature from luminosity
 * and radius via the Stefan–Boltzmann law.
 *
 * Equation: T_eff = (L / (4π · R² · σ))^(1/4)
 *
 * Assumptions:
 *   - The star radiates as a spherical blackbody
 *
 * Domain: Any positive luminosity and radius.
 *
 * @param luminosityWatts - Bolometric luminosity in watts
 * @param radiusMeters - Stellar radius in meters
 * @returns Effective temperature in Kelvin
 */
export function computeEffectiveTemperature(luminosityWatts: number, radiusMeters: number): number {
  if (!Number.isFinite(luminosityWatts) || luminosityWatts <= 0) {
    throw new PhysicsRangeError('luminosityWatts', luminosityWatts, [0, Infinity], 'W');
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new PhysicsRangeError('radiusMeters', radiusMeters, [0, Infinity], 'm');
  }
  return (
    (luminosityWatts /
      (4 * Math.PI * radiusMeters ** 2 * STEFAN_BOLTZMANN_CONSTANT_SIGMA)) **
    0.25
  );
}
