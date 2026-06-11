/**
 * @module physics/habitability/survival
 *
 * Survival-model scoring (ARCHITECTURE.md §3.4). Decomposes survivability
 * into independent physical factors, each scored against documented
 * physiological tolerances, then aggregates multiplicatively so a single
 * lethal axis drives the world to zero (the conservative choice; see
 * TECHNICAL_DECISIONS.md TD-014 and CLAUDE.md §6).
 *
 * Models implemented:
 *   - Human Baseline (unaided human survival, one axis at a time)
 *
 * Future work:
 *   - Extremophile carbon-based and silicon-based speculative models
 *     (add a model configuration; aggregation is shared)
 *   - Agricultural and colonization score axes (ARCHITECTURE.md §3.4)
 */

import type { PlanetaryState } from '../../types/physics';
import type {
  ConfidenceLevel,
  HabitabilityAssessment,
  HabitabilityStatus,
  SurvivalAssessment,
  SurvivalFactor,
  SurvivalFactorId,
} from '../../types/habitability';
import { STANDARD_GRAVITY_METERS_PER_SECOND_SQUARED } from '../constants';
import { assessLiquidWater } from './water';

/**
 * Scores a value that has both a lower and an upper tolerance: 1 inside
 * the optimal band, falling linearly to 0 at the survivable edges, and 0
 * (lethal) beyond them.
 */
function scoreTwoSidedRange(
  value: number,
  optimalLow: number,
  optimalHigh: number,
  survivableLow: number,
  survivableHigh: number,
): number {
  if (value < survivableLow || value > survivableHigh) {
    return 0;
  }
  if (value < optimalLow) {
    return (value - survivableLow) / (optimalLow - survivableLow);
  }
  if (value > optimalHigh) {
    return (survivableHigh - value) / (survivableHigh - optimalHigh);
  }
  return 1;
}

/**
 * Scores a value that only has an upper tolerance (a contaminant): 1 at or
 * below the optimal ceiling, falling linearly to 0 at the lethal ceiling.
 */
function scoreUpperBounded(value: number, optimalHigh: number, lethalHigh: number): number {
  if (value <= optimalHigh) {
    return 1;
  }
  if (value >= lethalHigh) {
    return 0;
  }
  return (lethalHigh - value) / (lethalHigh - optimalHigh);
}

/** Derives a qualitative status from a normalized [0, 1] suitability score. */
function statusFromScore(score: number): HabitabilityStatus {
  if (score <= 0) {
    return 'lethal';
  }
  if (score < 0.5) {
    return 'hostile';
  }
  if (score < 1) {
    return 'tolerable';
  }
  return 'optimal';
}

/** Partial pressure of a gas at the surface, in kPa (0 if absent). */
function partialPressure(state: PlanetaryState, gas: 'O2' | 'CO2'): number {
  return state.configuration.atmosphere.partialPressuresKilopascals[gas] ?? 0;
}

/**
 * Human Baseline tolerances. Each factor's optimal and survivable bounds
 * are drawn from aerospace and environmental physiology; see
 * docs/references.md. Gravity tolerance is `speculative`: only ~0 g and
 * 1 g human data exist, so all other values are extrapolation.
 */
function evaluateHumanBaselineFactors(state: PlanetaryState): SurvivalFactor[] {
  const surfaceTemperatureKelvin = state.climate.surfaceTemperatureKelvin;
  const surfacePressureKilopascals = state.atmosphere.surfacePressureKilopascals;
  const oxygenPartialKilopascals = partialPressure(state, 'O2');
  const carbonDioxidePartialKilopascals = partialPressure(state, 'CO2');
  const gravityG =
    state.bulk.surfaceGravityMetersPerSecondSquared / STANDARD_GRAVITY_METERS_PER_SECOND_SQUARED;

  const factors: { id: SurvivalFactorId; score: number; confidence: ConfidenceLevel; detail: string }[] = [
    {
      id: 'thermal',
      // Optimal 0–40 °C; survivable −40–60 °C ambient with clothing/shelter.
      score: scoreTwoSidedRange(surfaceTemperatureKelvin, 273.15, 313.15, 233.15, 333.15),
      confidence: 'estimated',
      detail: `Surface temperature ${Math.round(surfaceTemperatureKelvin)} K.`,
    },
    {
      id: 'pressure',
      // Optimal 50–250 kPa; survivable from the Armstrong limit (6.3 kPa,
      // where body fluids boil) up to ~5 atm.
      score: scoreTwoSidedRange(surfacePressureKilopascals, 50, 250, 6.3, 500),
      confidence: 'estimated',
      detail: `Surface pressure ${surfacePressureKilopascals.toFixed(1)} kPa.`,
    },
    {
      id: 'oxygen',
      // Optimal pO₂ 18–50 kPa; survivable 13 kPa (severe hypoxia floor) to
      // 95 kPa (acute oxygen toxicity).
      score: scoreTwoSidedRange(oxygenPartialKilopascals, 18, 50, 13, 95),
      confidence: 'estimated',
      detail: `Oxygen partial pressure ${oxygenPartialKilopascals.toFixed(1)} kPa.`,
    },
    {
      id: 'carbon-dioxide',
      // Tolerable below ~0.7 kPa; lethal toward ~7 kPa (≈7% at 1 atm).
      score: scoreUpperBounded(carbonDioxidePartialKilopascals, 0.7, 7),
      confidence: 'estimated',
      detail: `Carbon-dioxide partial pressure ${carbonDioxidePartialKilopascals.toFixed(2)} kPa.`,
    },
    {
      id: 'gravity',
      // Optimal 0.8–1.2 g; survivable 0.1–3 g (speculative — extrapolated).
      score: scoreTwoSidedRange(gravityG, 0.8, 1.2, 0.1, 3),
      confidence: 'speculative',
      detail: `Surface gravity ${gravityG.toFixed(2)} g.`,
    },
  ];

  return factors.map((factor) => ({
    factor: factor.id,
    score: factor.score,
    status: statusFromScore(factor.score),
    confidence: factor.confidence,
    detail: factor.detail,
  }));
}

/**
 * Assesses unaided human survivability of a world.
 *
 * Survivability is the product of the per-axis factor scores, scaled to
 * [0, 100]: any lethal axis yields 0. The limiting factor is the
 * lowest-scoring axis (first wins ties, in fixed factor order), and the
 * reported confidence is that of the limiting factor.
 *
 * @param state - The computed planetary state
 * @returns The human-baseline survival assessment
 */
export function assessHumanBaselineSurvival(state: PlanetaryState): SurvivalAssessment {
  const factors = evaluateHumanBaselineFactors(state);
  const product = factors.reduce((accumulator, factor) => accumulator * factor.score, 1);
  const survivabilityScore = product * 100;

  // Lowest-scoring axis; ties resolve to the earlier factor (fixed order).
  const limiting = factors.reduce((worst, factor) =>
    factor.score < worst.score ? factor : worst,
  );

  return {
    model: 'human-baseline',
    survivabilityScore,
    status: statusFromScore(product),
    limitingFactor: limiting.factor,
    overallConfidence: limiting.confidence,
    factors,
  };
}

/**
 * Produces the complete habitability assessment of a world: the
 * liquid-water determination and one survival assessment per modeled
 * organism baseline (Human Baseline for the MVP).
 *
 * This is the Habitability Engine entry point — a pure function of the
 * immutable `PlanetaryState`, written to but never read by the simulation
 * (ARCHITECTURE.md §3.4).
 *
 * @param state - The computed planetary state
 * @returns The structured habitability assessment
 */
export function assessHabitability(state: PlanetaryState): HabitabilityAssessment {
  return {
    liquidWater: assessLiquidWater(
      state.climate.surfaceTemperatureKelvin,
      state.atmosphere.surfacePressureKilopascals,
    ),
    survival: [assessHumanBaselineSurvival(state)],
  };
}
