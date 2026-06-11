/**
 * @module types/habitability
 *
 * Output contract of the Habitability Engine (ARCHITECTURE.md §3.4): a
 * structured assessment of a `PlanetaryState`, never a boolean. Consumed
 * downstream by the UI, the AI explainer, and (post-MVP) the Evolution
 * module, which requires factor-level structure (CLAUDE.md §16).
 */

/**
 * Epistemic status of a value (CLAUDE.md §6).
 *   - `calculated`: derived from physical equations
 *   - `estimated`: from empirical relations or well-characterized thresholds
 *   - `speculative`: extrapolated beyond the data that constrains it
 */
export type ConfidenceLevel = 'calculated' | 'estimated' | 'speculative';

/** Qualitative habitability status of a single axis or an overall score. */
export type HabitabilityStatus = 'optimal' | 'tolerable' | 'hostile' | 'lethal';

/** Identifier of a survival model (the organism baseline being evaluated). */
export type SurvivalModelId = 'human-baseline';

/** Identifier of a single survival factor (one physical axis). */
export type SurvivalFactorId =
  | 'thermal'
  | 'pressure'
  | 'oxygen'
  | 'carbon-dioxide'
  | 'gravity';

/** The evaluation of one physical axis against a survival model's tolerance. */
export interface SurvivalFactor {
  factor: SurvivalFactorId;
  /** Normalized suitability of this axis, 0 (lethal) to 1 (optimal). */
  score: number;
  status: HabitabilityStatus;
  confidence: ConfidenceLevel;
  /** Human-readable explanation of this axis's contribution. */
  detail: string;
}

/** A survival assessment for one organism baseline. */
export interface SurvivalAssessment {
  model: SurvivalModelId;
  /** Aggregate survivability, 0–100, the product of factor scores ×100. */
  survivabilityScore: number;
  /** Status derived from the aggregate score. */
  status: HabitabilityStatus;
  /** The lowest-scoring factor — the axis that most limits survival. */
  limitingFactor: SurvivalFactorId;
  /** Confidence of the limiting factor (the axis driving the score). */
  overallConfidence: ConfidenceLevel;
  /** Per-axis breakdown, in a fixed factor order. */
  factors: readonly SurvivalFactor[];
}

/** Whether liquid water can exist at the surface, and why. */
export interface LiquidWaterAssessment {
  possible: boolean;
  confidence: ConfidenceLevel;
  /**
   * Pressure-adjusted boiling point of water in Kelvin, or null when the
   * surface pressure is below water's triple point (no liquid phase).
   */
  boilingPointKelvin: number | null;
  detail: string;
}

/** The complete habitability assessment of a world. */
export interface HabitabilityAssessment {
  liquidWater: LiquidWaterAssessment;
  /** One survival assessment per modeled organism baseline. */
  survival: readonly SurvivalAssessment[];
}
