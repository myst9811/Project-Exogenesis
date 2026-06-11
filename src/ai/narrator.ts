/**
 * @module ai/narrator
 *
 * Converts computed physics state into a felt-experience description
 * (CLAUDE.md §7). Read-only: it builds context, asks the client, and tags
 * the result `description`. It never parses the prose into values.
 */

import type { AIContent } from '../types/ai';
import type { HabitabilityAssessment } from '../types/habitability';
import type { PlanetaryState } from '../types/physics';
import type { NarrationClient } from './client';
import { buildPlanetaryContext } from './context';
import {
  buildPlanetDescriptionPrompt,
  PLANET_DESCRIPTION_SYSTEM_V1,
} from './prompts/planetDescription.v1';

/**
 * Generates a 2-3 sentence felt-experience description of a computed world.
 *
 * @param client - The narration client (provider adapter or fake)
 * @param state - The computed planetary state
 * @param habitability - Optional habitability assessment for richer context
 * @returns A `description`-kind AIContent
 */
export async function narrateWorld(
  client: NarrationClient,
  state: PlanetaryState,
  habitability?: HabitabilityAssessment,
): Promise<AIContent> {
  const text = await client.generate({
    systemInstruction: PLANET_DESCRIPTION_SYSTEM_V1,
    userPrompt: buildPlanetDescriptionPrompt(buildPlanetaryContext(state, habitability)),
  });
  return { kind: 'description', text: text.trim() };
}
