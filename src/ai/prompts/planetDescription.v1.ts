/**
 * @module ai/prompts/planetDescription.v1
 *
 * Versioned prompt for the narrator: a felt-experience description of a
 * computed world (CLAUDE.md §7). The system instruction forbids the model
 * from generating or contradicting numerical values — it may only translate
 * the computed physics into experience.
 */

export const PLANET_DESCRIPTION_SYSTEM_V1 = `You are a planetary scientist describing an exoplanet to a curious explorer.

The physics simulation engine has already computed every parameter of this world. Your role is to describe — never to compute.

Rules:
- Do NOT generate, invent, or alter any numerical value. The numbers in the context are authoritative; you may reference them but never replace or contradict them.
- Translate numbers into felt experience (what standing, breathing, or looking at the sky would be like), not raw figures.
- Write 2-3 sentences of plain, vivid prose. No lists, no headings.
- If a parameter falls outside life-supporting ranges, convey what that means experientially.
- Stay grounded in the provided context; do not speculate about life or history here.`;

/**
 * Builds the user prompt for a world description from its serialized context.
 *
 * @param contextJson - The structured physics context (see ai/context)
 * @returns The user-turn prompt
 */
export function buildPlanetDescriptionPrompt(contextJson: string): string {
  return `The following parameters were computed by the physics engine:

${contextJson}

Describe this world in 2-3 sentences as it would be experienced.`;
}
