/**
 * @module ai/context
 *
 * Builds the structured physics context handed to the AI layer (CLAUDE.md
 * §7: "Provide the complete relevant PlanetaryState as structured context").
 * Pure and read-only — it serializes computed values the engine produced;
 * it imports physics *types* only and computes nothing (ADR-003, §4).
 *
 * Unit-suffixed keys are preserved verbatim so the model sees the units of
 * every value without inference.
 */

import type { HabitabilityAssessment } from '../types/habitability';
import type { PlanetaryState } from '../types/physics';

/**
 * Serializes the computed world (and optional habitability assessment) into
 * a deterministic JSON string for prompt context.
 *
 * @param state - The computed planetary state
 * @param habitability - Optional habitability assessment
 * @returns Pretty-printed JSON of the relevant computed values
 */
export function buildPlanetaryContext(
  state: PlanetaryState,
  habitability?: HabitabilityAssessment,
): string {
  const context = {
    schemaVersion: state.schemaVersion,
    star: state.stellar,
    orbit: state.orbit,
    planet: state.bulk,
    atmosphere: state.atmosphere,
    climate: state.climate,
    habitableZone: state.habitableZone,
    composition: state.configuration.planetary.compositionClass,
    ...(habitability === undefined ? {} : { habitability }),
  };
  return JSON.stringify(context, null, 2);
}
