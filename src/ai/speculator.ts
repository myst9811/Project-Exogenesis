/**
 * @module ai/speculator
 *
 * Produces clearly-labeled extrapolation about a computed world (CLAUDE.md
 * §7). Output is always tagged `speculation` and carries a `speculationBasis`
 * so the UI can show that it is extrapolated, not computed (ADR-003).
 */

import type { AIContent } from '../types/ai';
import type { HabitabilityAssessment } from '../types/habitability';
import type { PlanetaryState } from '../types/physics';
import type { NarrationClient } from './client';
import { buildPlanetaryContext } from './context';
import {
  buildEcologySpeculationPrompt,
  ECOLOGY_SPECULATION_SYSTEM_V1,
} from './prompts/ecologySpeculation.v1';

/** What every ecological speculation is extrapolated from — shown in the UI. */
const ECOLOGY_SPECULATION_BASIS =
  'Extrapolated from the computed surface temperature, atmosphere, and habitable-zone position — not computed by the physics engine.';

/**
 * Generates clearly-labeled speculation about a world's environment or
 * potential for life.
 *
 * @param client - The narration client (provider adapter or fake)
 * @param state - The computed planetary state
 * @param habitability - Optional habitability assessment for richer context
 * @returns A `speculation`-kind AIContent with its extrapolation basis
 */
export async function speculateEcology(
  client: NarrationClient,
  state: PlanetaryState,
  habitability?: HabitabilityAssessment,
): Promise<AIContent> {
  const text = await client.generate({
    systemInstruction: ECOLOGY_SPECULATION_SYSTEM_V1,
    userPrompt: buildEcologySpeculationPrompt(buildPlanetaryContext(state, habitability)),
  });
  return {
    kind: 'speculation',
    text: text.trim(),
    speculationBasis: ECOLOGY_SPECULATION_BASIS,
  };
}
