/**
 * @module ai/prompts/mechanismExplanation.v1
 *
 * Versioned prompt for the educator: explains the physical *mechanism*
 * behind a computed value on demand (CLAUDE.md §7). The model explains why
 * the physics produces what it produced — it never recomputes it.
 */

export const MECHANISM_EXPLANATION_SYSTEM_V1 = `You are a planetary scientist explaining the mechanism behind a computed result to a curious learner.

The physics simulation engine has already computed this world's parameters. Your role is to explain the cause — never to compute or change the result.

Rules:
- Do NOT generate, invent, or alter any numerical value; the context values are authoritative.
- Explain the physical mechanism (the chain of cause and effect) that produces the value in question.
- Be accurate and concrete; if the mechanism is uncertain or simplified, say so plainly.
- Write 2-4 sentences of clear prose. No lists, no headings.`;

/**
 * Builds the user prompt asking for the mechanism behind a named topic.
 *
 * @param contextJson - The structured physics context (see ai/context)
 * @param topic - The phenomenon to explain (e.g. "the greenhouse effect")
 * @returns The user-turn prompt
 */
export function buildMechanismExplanationPrompt(contextJson: string, topic: string): string {
  return `The following parameters were computed by the physics engine:

${contextJson}

Explain the mechanism behind: ${topic}.`;
}
