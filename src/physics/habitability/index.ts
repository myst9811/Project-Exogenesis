/**
 * @module physics/habitability
 *
 * Habitable zone geometry from the Kopparapu et al. parameterization.
 *
 * Models implemented:
 *   - Conservative HZ: runaway greenhouse (inner) to maximum greenhouse (outer)
 *   - Optimistic HZ: recent Venus (inner) to early Mars (outer)
 *   - Planet position classification against both zones
 *
 * Assumptions:
 *   - 1 Earth-mass planet with an Earth-like H₂O/CO₂ atmosphere
 *     (the Kopparapu model planets)
 *
 * Simplifications:
 *   - Position uses the semi-major axis; eccentricity-averaged flux
 *     is not modeled in the MVP
 *
 * Future work:
 *   - Mass-dependent runaway greenhouse limits (Kopparapu et al. 2014
 *     5 M⊕ / 0.1 M⊕ coefficient sets)
 *
 * The structured survival and liquid-water assessment (the Habitability
 * Engine of ARCHITECTURE.md §3.4) lives in ./survival and ./water,
 * re-exported below.
 */

import type { HabitableZonePosition } from '../../types/physics';
import {
  ASTRONOMICAL_UNIT_AU,
  NOMINAL_SOLAR_LUMINOSITY_L_SUN,
} from '../constants';
import { PhysicsRangeError } from '../errors';

/** Domain of validity of the Kopparapu parameterization (Kelvin). */
export const KOPPARAPU_MINIMUM_TEFF_KELVIN = 2600;
export const KOPPARAPU_MAXIMUM_TEFF_KELVIN = 7200;

/** Reference temperature of the polynomial: T' = T_eff − 5780 K. */
const KOPPARAPU_REFERENCE_TEFF_KELVIN = 5780;

interface KopparapuLimitCoefficients {
  /** Effective stellar flux at solar T_eff, in units of Earth's insolation. */
  effectiveFluxAtSolar: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

/**
 * Habitable zone limit coefficients. Source: Kopparapu et al. (2013,
 * ApJ 765, 131; erratum 2013, ApJ 770, 82) with the 1 M⊕ runaway
 * greenhouse update of Kopparapu et al. (2014, ApJ 787, L29), as
 * published in the authors' HZ calculator coefficient file. Valid for
 * 2600 K ≤ T_eff ≤ 7200 K.
 */
const KOPPARAPU_LIMITS: Record<
  'recentVenus' | 'runawayGreenhouse' | 'maximumGreenhouse' | 'earlyMars',
  KopparapuLimitCoefficients
> = {
  recentVenus: {
    effectiveFluxAtSolar: 1.776,
    a: 2.136e-4,
    b: 2.533e-8,
    c: -1.332e-11,
    d: -3.097e-15,
  },
  runawayGreenhouse: {
    effectiveFluxAtSolar: 1.107,
    a: 1.332e-4,
    b: 1.58e-8,
    c: -8.308e-12,
    d: -1.931e-15,
  },
  maximumGreenhouse: {
    effectiveFluxAtSolar: 0.356,
    a: 6.171e-5,
    b: 1.698e-9,
    c: -3.198e-12,
    d: -5.575e-16,
  },
  earlyMars: {
    effectiveFluxAtSolar: 0.32,
    a: 5.547e-5,
    b: 1.526e-9,
    c: -2.874e-12,
    d: -5.011e-16,
  },
};

/** Habitable zone edge distances for one star. All distances in meters. */
export interface HabitableZoneResult {
  /** Runaway greenhouse limit — inner edge of the conservative HZ. */
  conservativeInnerEdgeMeters: number;
  /** Maximum greenhouse limit — outer edge of the conservative HZ. */
  conservativeOuterEdgeMeters: number;
  /** Recent Venus limit — inner edge of the optimistic HZ. */
  optimisticInnerEdgeMeters: number;
  /** Early Mars limit — outer edge of the optimistic HZ. */
  optimisticOuterEdgeMeters: number;
}

/** Evaluates one Kopparapu limit's effective flux (Earth insolation units). */
function computeEffectiveFlux(
  coefficients: KopparapuLimitCoefficients,
  stellarTemperatureKelvin: number,
): number {
  const t = stellarTemperatureKelvin - KOPPARAPU_REFERENCE_TEFF_KELVIN;
  return (
    coefficients.effectiveFluxAtSolar +
    coefficients.a * t +
    coefficients.b * t ** 2 +
    coefficients.c * t ** 3 +
    coefficients.d * t ** 4
  );
}

/**
 * Computes the habitable zone edges for a main-sequence star.
 *
 * Equation: S_eff = S_eff☉ + aT' + bT'² + cT'³ + dT'⁴ with
 *           T' = T_eff − 5780 K, then d = √((L/L☉) / S_eff) AU per limit.
 *
 * Domain: 2600 K ≤ T_eff ≤ 7200 K (the Kopparapu grid); positive luminosity.
 *
 * @param stellarTemperatureKelvin - Stellar effective temperature in Kelvin
 * @param luminosityWatts - Stellar bolometric luminosity in watts
 * @returns Habitable zone edge distances in meters
 *
 * @see Kopparapu et al. (2013), doi:10.1088/0004-637X/765/2/131 (+ erratum)
 * @see Kopparapu et al. (2014), doi:10.1088/2041-8205/787/2/L29
 */
export function computeHabitableZone(
  stellarTemperatureKelvin: number,
  luminosityWatts: number,
): HabitableZoneResult {
  if (
    !Number.isFinite(stellarTemperatureKelvin) ||
    stellarTemperatureKelvin < KOPPARAPU_MINIMUM_TEFF_KELVIN ||
    stellarTemperatureKelvin > KOPPARAPU_MAXIMUM_TEFF_KELVIN
  ) {
    throw new PhysicsRangeError(
      'stellarTemperatureKelvin',
      stellarTemperatureKelvin,
      [KOPPARAPU_MINIMUM_TEFF_KELVIN, KOPPARAPU_MAXIMUM_TEFF_KELVIN],
      'K',
    );
  }
  if (!Number.isFinite(luminosityWatts) || luminosityWatts <= 0) {
    throw new PhysicsRangeError('luminosityWatts', luminosityWatts, [0, Infinity], 'W');
  }
  const luminositySolar = luminosityWatts / NOMINAL_SOLAR_LUMINOSITY_L_SUN;
  const edgeMeters = (coefficients: KopparapuLimitCoefficients): number =>
    Math.sqrt(luminositySolar / computeEffectiveFlux(coefficients, stellarTemperatureKelvin)) *
    ASTRONOMICAL_UNIT_AU;
  return {
    conservativeInnerEdgeMeters: edgeMeters(KOPPARAPU_LIMITS.runawayGreenhouse),
    conservativeOuterEdgeMeters: edgeMeters(KOPPARAPU_LIMITS.maximumGreenhouse),
    optimisticInnerEdgeMeters: edgeMeters(KOPPARAPU_LIMITS.recentVenus),
    optimisticOuterEdgeMeters: edgeMeters(KOPPARAPU_LIMITS.earlyMars),
  };
}

/**
 * Classifies a planet's orbital position against the habitable zone.
 *
 * Conservative-zone membership implies optimistic-zone membership; the
 * 'inside-optimistic' classification covers the two annuli between the
 * optimistic and conservative edges.
 *
 * @param semiMajorAxisMeters - Planet semi-major axis in meters
 * @param habitableZone - Habitable zone edges from computeHabitableZone
 * @returns Position classification
 */
export function classifyHabitableZonePosition(
  semiMajorAxisMeters: number,
  habitableZone: HabitableZoneResult,
): HabitableZonePosition {
  if (!Number.isFinite(semiMajorAxisMeters) || semiMajorAxisMeters <= 0) {
    throw new PhysicsRangeError('semiMajorAxisMeters', semiMajorAxisMeters, [0, Infinity], 'm');
  }
  if (semiMajorAxisMeters < habitableZone.optimisticInnerEdgeMeters) {
    return 'too-hot';
  }
  if (semiMajorAxisMeters < habitableZone.conservativeInnerEdgeMeters) {
    return 'inside-optimistic';
  }
  if (semiMajorAxisMeters <= habitableZone.conservativeOuterEdgeMeters) {
    return 'inside-conservative';
  }
  if (semiMajorAxisMeters <= habitableZone.optimisticOuterEdgeMeters) {
    return 'inside-optimistic';
  }
  return 'too-cold';
}

export { computeWaterBoilingPoint, assessLiquidWater } from './water';
export {
  assessHabitability,
  assessHumanBaselineSurvival,
} from './survival';
