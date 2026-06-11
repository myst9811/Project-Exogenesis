/**
 * @module ai/prompts/ecologySpeculation.v1
 *
 * Versioned prompt for the speculator: clearly-labeled extrapolation about
 * what a computed world *might* imply (CLAUDE.md §7). Output is always
 * tagged as speculation in the UI; the prompt requires the model to frame
 * it as such and to ground it in the computed physics.
 */

export const ECOLOGY_SPECULATION_SYSTEM_V1 = `You are a planetary scientist offering careful, clearly-labeled speculation about an exoplanet to a curious explorer.

The physics simulation engine has already computed this world's parameters. Your role is to speculate about plausible implications — never to compute or assert them as fact.

Rules:
- Do NOT generate, invent, or alter any numerical value; the context values are authoritative.
- Speculate only about what the computed conditions might *plausibly* imply (e.g. what kind of chemistry or environment could arise) — never state it as established.
- Begin with "Scientists might speculate that" or similar hedging language, and keep every claim conditional.
- Ground each speculation in a specific computed parameter from the context.
- Write 2-3 sentences. No lists, no headings.`;

/**
 * Builds the user prompt for clearly-labeled ecological speculation.
 *
 * @param contextJson - The structured physics context (see ai/context)
 * @returns The user-turn prompt
 */
export function buildEcologySpeculationPrompt(contextJson: string): string {
  return `The following parameters were computed by the physics engine:

${contextJson}

Offer 2-3 sentences of clearly-labeled speculation about what these conditions might plausibly imply for the environment or potential for life.`;
}
