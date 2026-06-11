/**
 * @module ai/educator
 *
 * Explains the physical mechanism behind a computed value on demand
 * (CLAUDE.md §7). Read-only: it explains the cause of a result, never
 * recomputes it. Output is tagged `explanation`.
 */

import type { AIContent } from '../types/ai';
import type { HabitabilityAssessment } from '../types/habitability';
import type { PlanetaryState } from '../types/physics';
import type { NarrationClient } from './client';
import { buildPlanetaryContext } from './context';
import {
  buildMechanismExplanationPrompt,
  MECHANISM_EXPLANATION_SYSTEM_V1,
} from './prompts/mechanismExplanation.v1';

/**
 * Explains the mechanism behind a named phenomenon for this world.
 *
 * @param client - The narration client (provider adapter or fake)
 * @param state - The computed planetary state
 * @param topic - The phenomenon to explain (e.g. "the surface temperature")
 * @param habitability - Optional habitability assessment for richer context
 * @returns An `explanation`-kind AIContent
 */
export async function explainMechanism(
  client: NarrationClient,
  state: PlanetaryState,
  topic: string,
  habitability?: HabitabilityAssessment,
): Promise<AIContent> {
  const text = await client.generate({
    systemInstruction: MECHANISM_EXPLANATION_SYSTEM_V1,
    userPrompt: buildMechanismExplanationPrompt(buildPlanetaryContext(state, habitability), topic),
  });
  return { kind: 'explanation', text: text.trim() };
}
