/**
 * @module physics/climate
 *
 * Planetary energy budget: equilibrium temperature, bond albedo, and a
 * simplified greenhouse model.
 *
 * Models implemented:
 *   - Equilibrium (blackbody) temperature from stellar irradiance
 *   - Bond albedo estimated from bulk composition class
 *   - Gray two-stream greenhouse: T_s⁴ = T_eq⁴ · (1 + τ/2)
 *   - Per-gas optical depth with square-root pressure scaling and a
 *     pressure-broadening factor, calibrated to Earth/Venus/Mars
 *
 * Assumptions:
 *   - Rapid rotation (uniform temperature distribution)
 *   - No water-vapor or ice-albedo feedback loops (greenhouse gases are
 *     inputs, not responses)
 *
 * Future work:
 *   - Iterative energy balance with feedback coupling
 *   - Latitudinal temperature distribution
 */

import type { AtmosphericGas, PlanetCompositionClass } from '../../types/configuration';
import { EARTH_SURFACE_PRESSURE_KILOPASCALS } from '../constants';
import { PhysicsRangeError } from '../errors';
import { computeTotalSurfacePressure } from '../atmosphere';

/**
 * ESTIMATE: Bond albedo by bulk composition class, anchored on measured
 * solar-system bond albedos (NASA planetary fact sheets): Earth 0.306
 * (rocky with clouds and oceans), Mercury 0.088 (bare iron-rich rock),
 * Neptune 0.290 (ice/gas envelope). Water worlds are assigned the
 * Earth-like value pending an ocean-specific model.
 */
export const BOND_ALBEDO_BY_COMPOSITION: Record<PlanetCompositionClass, number> = {
  'rocky-silicate': 0.306,
  'iron-rich': 0.088,
  'water-world': 0.306,
  'gas-dwarf': 0.29,
};

/**
 * ESTIMATE: Greenhouse optical-depth anchors per gas: the gray optical
 * depth contributed at an Earth-anchor partial pressure, scaled as
 * √(p/p_anchor) (strong-line curve-of-growth regime; Pierrehumbert 2010
 * §4) with a √(P_total/P⊕) pressure-broadening factor capped at 1.
 *
 * Calibration: anchors split Earth's required total τ ≈ 1.30 (which
 * reproduces T_s = 288 K from T_eq = 254 K) between H₂O and CO₂ in the
 * proportions of the Schmidt et al. (2010) greenhouse attribution, with
 * the CH₄ anchor from its ~5% share at 1.9 ppmv. Validated against Venus
 * (computed 696 K vs 737 K observed) and Mars (computed 213 K vs ~210 K).
 *
 * Caveat: increasingly speculative beyond ~100× the anchor pressures;
 * no runaway-greenhouse feedback is modeled.
 */
export const GREENHOUSE_OPTICAL_DEPTH_ANCHORS: Partial<
  Record<AtmosphericGas, { opticalDepth: number; anchorPartialPressureKilopascals: number }>
> = {
  H2O: { opticalDepth: 0.93, anchorPartialPressureKilopascals: 1.3 },
  CO2: { opticalDepth: 0.37, anchorPartialPressureKilopascals: 0.04 },
  CH4: { opticalDepth: 0.06, anchorPartialPressureKilopascals: 1.9e-4 },
};

/**
 * Returns the estimated bond albedo for a bulk composition class.
 *
 * ESTIMATE: see BOND_ALBEDO_BY_COMPOSITION. This is the MVP composition-
 * weighted albedo model; future work derives albedo from computed surface
 * and cloud state.
 *
 * @param compositionClass - Bulk composition class of the planet
 * @returns Bond albedo (dimensionless, 0–1)
 */
export function estimateBondAlbedo(compositionClass: PlanetCompositionClass): number {
  return BOND_ALBEDO_BY_COMPOSITION[compositionClass];
}

/**
 * Computes equilibrium surface temperature using the energy balance model.
 *
 * Equation: T_eq = T_star · √(R_star / (2a)) · (1 − A)^(1/4)
 *
 * Assumptions:
 *   - Rapid rotation (heat redistributed uniformly)
 *   - No greenhouse effect (bare-rock blackbody emitter)
 *   - Lambertian reflectance (uniform albedo)
 *
 * Simplifications:
 *   - Ignores tidal and radiogenic internal heating
 *   - Circular-orbit irradiance (uses the semi-major axis)
 *
 * Domain: Valid for planets around main-sequence stars.
 *
 * @param stellarTemperatureKelvin - Stellar effective temperature in Kelvin
 * @param stellarRadiusMeters - Stellar radius in meters
 * @param semiMajorAxisMeters - Orbital semi-major axis in meters
 * @param bondAlbedo - Bond albedo (dimensionless, 0–1)
 * @returns Equilibrium temperature in Kelvin
 *
 * @see de Pater & Lissauer, Planetary Sciences, 2nd ed., §3.1
 */
export function computeEquilibriumTemperature(
  stellarTemperatureKelvin: number,
  stellarRadiusMeters: number,
  semiMajorAxisMeters: number,
  bondAlbedo: number,
): number {
  if (!Number.isFinite(stellarTemperatureKelvin) || stellarTemperatureKelvin <= 0) {
    throw new PhysicsRangeError(
      'stellarTemperatureKelvin',
      stellarTemperatureKelvin,
      [0, Infinity],
      'K',
    );
  }
  if (!Number.isFinite(stellarRadiusMeters) || stellarRadiusMeters <= 0) {
    throw new PhysicsRangeError('stellarRadiusMeters', stellarRadiusMeters, [0, Infinity], 'm');
  }
  if (!Number.isFinite(semiMajorAxisMeters) || semiMajorAxisMeters <= 0) {
    throw new PhysicsRangeError('semiMajorAxisMeters', semiMajorAxisMeters, [0, Infinity], 'm');
  }
  if (!Number.isFinite(bondAlbedo) || bondAlbedo < 0 || bondAlbedo > 1) {
    throw new PhysicsRangeError('bondAlbedo', bondAlbedo, [0, 1], '(dimensionless)');
  }
  return (
    stellarTemperatureKelvin *
    Math.sqrt(stellarRadiusMeters / (2 * semiMajorAxisMeters)) *
    (1 - bondAlbedo) ** 0.25
  );
}

/**
 * Estimates the gray longwave optical depth of an atmosphere from its
 * greenhouse gas partial pressures.
 *
 * Equation: τ = Σᵢ τᵢ,⊕ · √(pᵢ / pᵢ,⊕) · min(1, √(P / P⊕))
 *
 * The √p term is the strong-line curve-of-growth scaling; the broadening
 * factor accounts for the weakening of absorption lines in thin
 * atmospheres and saturates at Earth-like total pressure (Pierrehumbert
 * 2010, ch. 4). Non-greenhouse gases (N₂, O₂, Ar, H₂, He) contribute only
 * via the broadening term; H₂ collision-induced absorption is not modeled.
 *
 * Domain: Calibrated for 10⁻⁴–10⁴ kPa greenhouse-gas partial pressures;
 * results are increasingly speculative toward the ends of that range.
 *
 * @param partialPressuresKilopascals - Surface partial pressure per gas, kPa
 * @returns Gray longwave optical depth (dimensionless, ≥ 0)
 */
export function estimateGreenhouseOpticalDepth(
  partialPressuresKilopascals: Partial<Record<AtmosphericGas, number>>,
): number {
  const totalPressureKilopascals = computeTotalSurfacePressure(partialPressuresKilopascals);
  if (totalPressureKilopascals === 0) {
    return 0;
  }
  const broadeningFactor = Math.min(
    1,
    Math.sqrt(totalPressureKilopascals / EARTH_SURFACE_PRESSURE_KILOPASCALS),
  );
  let opticalDepth = 0;
  for (const [gas, anchor] of Object.entries(GREENHOUSE_OPTICAL_DEPTH_ANCHORS)) {
    const partialPressure = partialPressuresKilopascals[gas as AtmosphericGas];
    if (partialPressure === undefined || partialPressure <= 0) {
      continue;
    }
    opticalDepth +=
      anchor.opticalDepth *
      Math.sqrt(partialPressure / anchor.anchorPartialPressureKilopascals) *
      broadeningFactor;
  }
  return opticalDepth;
}

/**
 * Computes the greenhouse-adjusted surface temperature with the gray
 * two-stream radiative model.
 *
 * Equation: T_s = T_eq · (1 + τ/2)^(1/4)
 *
 * Assumptions:
 *   - Gray (wavelength-independent) longwave opacity
 *   - Radiative equilibrium; no convective adjustment
 *
 * Domain: Valid for optically thin to moderately thick atmospheres; for
 * τ ≫ 100 real atmospheres convect, so results are upper bounds.
 *
 * @param equilibriumTemperatureKelvin - Bare-rock equilibrium temperature in Kelvin
 * @param greenhouseOpticalDepth - Gray longwave optical depth (≥ 0)
 * @returns Surface temperature in Kelvin
 *
 * @see Pierrehumbert (2010), Principles of Planetary Climate, ch. 4
 */
export function computeGreenhouseSurfaceTemperature(
  equilibriumTemperatureKelvin: number,
  greenhouseOpticalDepth: number,
): number {
  if (!Number.isFinite(equilibriumTemperatureKelvin) || equilibriumTemperatureKelvin <= 0) {
    throw new PhysicsRangeError(
      'equilibriumTemperatureKelvin',
      equilibriumTemperatureKelvin,
      [0, Infinity],
      'K',
    );
  }
  if (!Number.isFinite(greenhouseOpticalDepth) || greenhouseOpticalDepth < 0) {
    throw new PhysicsRangeError(
      'greenhouseOpticalDepth',
      greenhouseOpticalDepth,
      [0, Infinity],
      '(dimensionless)',
    );
  }
  return equilibriumTemperatureKelvin * (1 + greenhouseOpticalDepth / 2) ** 0.25;
}
