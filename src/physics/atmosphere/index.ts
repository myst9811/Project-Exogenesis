/**
 * @module physics/atmosphere
 *
 * Atmospheric bulk properties and thermal escape analysis.
 *
 * Models implemented:
 *   - Total surface pressure from partial pressures
 *   - Mean molar mass from composition
 *   - Isothermal scale height
 *   - Jeans escape parameter and retention classification
 *
 * Assumptions:
 *   - Well-mixed atmosphere (single-layer model)
 *   - Hydrostatic equilibrium
 *   - Ideal gas behavior
 *
 * Future work:
 *   - Photochemistry; vertical temperature structure
 *   - Hydrodynamic and non-thermal escape channels
 */

import type { AtmosphericGas } from '../../types/configuration';
import {
  AVOGADRO_CONSTANT_N_A,
  BOLTZMANN_CONSTANT_K_B,
  MOLAR_GAS_CONSTANT_R,
  MOLAR_MASS_KILOGRAMS_PER_MOLE,
} from '../constants';
import { PhysicsRangeError } from '../errors';

/**
 * ESTIMATE: Jeans-parameter thresholds for retention classification, from
 * the rule of thumb that a gas survives Gyr timescales when the escape
 * velocity exceeds ~6× the mean thermal speed (λ ≥ 54), and is lost
 * rapidly below ~4× (λ < 24). Source: Catling & Zahnle (2009).
 */
export const JEANS_PARAMETER_RETAINED_THRESHOLD = 54;
export const JEANS_PARAMETER_ESCAPING_THRESHOLD = 24;

export type JeansRetentionClassification = 'retained' | 'losing' | 'escaping';

/** Thermal escape outlook for one atmospheric gas. */
export interface GasRetentionResult {
  gas: AtmosphericGas;
  /** Dimensionless Jeans escape parameter λ at the evaluation temperature. */
  jeansParameter: number;
  classification: JeansRetentionClassification;
}

/**
 * Computes total surface pressure as the sum of partial pressures
 * (Dalton's law).
 *
 * Domain: All partial pressures finite and non-negative; an empty map is
 * a valid airless world with total pressure 0.
 *
 * @param partialPressuresKilopascals - Surface partial pressure per gas, kPa
 * @returns Total surface pressure in kilopascals
 */
export function computeTotalSurfacePressure(
  partialPressuresKilopascals: Partial<Record<AtmosphericGas, number>>,
): number {
  let totalKilopascals = 0;
  for (const [gas, pressure] of Object.entries(partialPressuresKilopascals)) {
    if (!Number.isFinite(pressure) || pressure < 0) {
      throw new PhysicsRangeError(
        `partialPressuresKilopascals.${gas}`,
        pressure,
        [0, Infinity],
        'kPa',
      );
    }
    totalKilopascals += pressure;
  }
  return totalKilopascals;
}

/**
 * Computes the pressure-weighted mean molar mass of the atmosphere.
 *
 * Equation: M̄ = Σ(pᵢ · Mᵢ) / Σpᵢ
 *
 * Assumptions:
 *   - Ideal gases: partial pressure fractions equal molar fractions
 *
 * Domain: Total pressure must be positive (undefined for airless worlds).
 *
 * @param partialPressuresKilopascals - Surface partial pressure per gas, kPa
 * @returns Mean molar mass in kg/mol
 */
export function computeMeanMolarMass(
  partialPressuresKilopascals: Partial<Record<AtmosphericGas, number>>,
): number {
  const totalKilopascals = computeTotalSurfacePressure(partialPressuresKilopascals);
  if (totalKilopascals <= 0) {
    throw new PhysicsRangeError('totalPressureKilopascals', totalKilopascals, [0, Infinity], 'kPa');
  }
  let weightedSum = 0;
  for (const [gas, pressure] of Object.entries(partialPressuresKilopascals)) {
    weightedSum += pressure * MOLAR_MASS_KILOGRAMS_PER_MOLE[gas as AtmosphericGas];
  }
  return weightedSum / totalKilopascals;
}

/**
 * Computes the isothermal atmospheric scale height: the altitude interval
 * over which pressure falls by a factor of e.
 *
 * Equation: H = R · T / (M̄ · g)
 *
 * Assumptions:
 *   - Isothermal atmosphere at the given temperature
 *   - Constant gravity over the pressure scale (thin-shell approximation)
 *
 * Domain: Positive temperature, molar mass, and gravity.
 *
 * @param temperatureKelvin - Atmospheric temperature in Kelvin
 * @param meanMolarMassKilogramsPerMole - Mean molar mass in kg/mol
 * @param surfaceGravityMetersPerSecondSquared - Surface gravity in m/s²
 * @returns Scale height in meters
 */
export function computeScaleHeight(
  temperatureKelvin: number,
  meanMolarMassKilogramsPerMole: number,
  surfaceGravityMetersPerSecondSquared: number,
): number {
  if (!Number.isFinite(temperatureKelvin) || temperatureKelvin <= 0) {
    throw new PhysicsRangeError('temperatureKelvin', temperatureKelvin, [0, Infinity], 'K');
  }
  if (!Number.isFinite(meanMolarMassKilogramsPerMole) || meanMolarMassKilogramsPerMole <= 0) {
    throw new PhysicsRangeError(
      'meanMolarMassKilogramsPerMole',
      meanMolarMassKilogramsPerMole,
      [0, Infinity],
      'kg/mol',
    );
  }
  if (
    !Number.isFinite(surfaceGravityMetersPerSecondSquared) ||
    surfaceGravityMetersPerSecondSquared <= 0
  ) {
    throw new PhysicsRangeError(
      'surfaceGravityMetersPerSecondSquared',
      surfaceGravityMetersPerSecondSquared,
      [0, Infinity],
      'm/s²',
    );
  }
  return (
    (MOLAR_GAS_CONSTANT_R * temperatureKelvin) /
    (meanMolarMassKilogramsPerMole * surfaceGravityMetersPerSecondSquared)
  );
}

/**
 * Computes the dimensionless Jeans escape parameter for one gas.
 *
 * Equation: λ = v_esc² · m / (2 · k_B · T), with m = M / N_A
 *
 * Assumptions:
 *   - Maxwell-Boltzmann velocity distribution at temperature T
 *
 * Simplifications:
 *   - Evaluated at the surface temperature, not the exobase. Real
 *     thermospheres are hotter, so this UNDERESTIMATES escape for light
 *     gases on planets with hot upper atmospheres (Earth's hydrogen
 *     budget is the canonical example). Conservative for heavy gases.
 *
 * Domain: Positive escape velocity and temperature.
 *
 * @param escapeVelocityMetersPerSecond - Surface escape velocity in m/s
 * @param temperatureKelvin - Evaluation temperature in Kelvin
 * @param gas - The gas species to evaluate
 * @returns Dimensionless Jeans parameter λ
 */
export function computeJeansParameter(
  escapeVelocityMetersPerSecond: number,
  temperatureKelvin: number,
  gas: AtmosphericGas,
): number {
  if (!Number.isFinite(escapeVelocityMetersPerSecond) || escapeVelocityMetersPerSecond <= 0) {
    throw new PhysicsRangeError(
      'escapeVelocityMetersPerSecond',
      escapeVelocityMetersPerSecond,
      [0, Infinity],
      'm/s',
    );
  }
  if (!Number.isFinite(temperatureKelvin) || temperatureKelvin <= 0) {
    throw new PhysicsRangeError('temperatureKelvin', temperatureKelvin, [0, Infinity], 'K');
  }
  const moleculeMassKilograms = MOLAR_MASS_KILOGRAMS_PER_MOLE[gas] / AVOGADRO_CONSTANT_N_A;
  return (
    (escapeVelocityMetersPerSecond ** 2 * moleculeMassKilograms) /
    (2 * BOLTZMANN_CONSTANT_K_B * temperatureKelvin)
  );
}

/**
 * Classifies the thermal escape outlook for every gas present in the
 * atmosphere (partial pressure > 0), using the Jeans parameter thresholds
 * documented above.
 *
 * @param escapeVelocityMetersPerSecond - Surface escape velocity in m/s
 * @param temperatureKelvin - Evaluation temperature in Kelvin
 * @param partialPressuresKilopascals - Surface partial pressure per gas, kPa
 * @returns One retention result per present gas, in input order
 */
export function estimateAtmosphericRetention(
  escapeVelocityMetersPerSecond: number,
  temperatureKelvin: number,
  partialPressuresKilopascals: Partial<Record<AtmosphericGas, number>>,
): GasRetentionResult[] {
  const results: GasRetentionResult[] = [];
  for (const [gas, pressure] of Object.entries(partialPressuresKilopascals)) {
    if (pressure <= 0) {
      continue;
    }
    const jeansParameter = computeJeansParameter(
      escapeVelocityMetersPerSecond,
      temperatureKelvin,
      gas as AtmosphericGas,
    );
    let classification: JeansRetentionClassification;
    if (jeansParameter >= JEANS_PARAMETER_RETAINED_THRESHOLD) {
      classification = 'retained';
    } else if (jeansParameter >= JEANS_PARAMETER_ESCAPING_THRESHOLD) {
      classification = 'losing';
    } else {
      classification = 'escaping';
    }
    results.push({ gas: gas as AtmosphericGas, jeansParameter, classification });
  }
  return results;
}
