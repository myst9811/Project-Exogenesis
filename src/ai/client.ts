/**
 * @module ai/client
 *
 * The provider-agnostic narration client (TD-008, TD-015). The narrator,
 * educator, and speculator depend only on this interface; a concrete
 * provider (Gemini, a proxy, a fake for tests) implements it. Swapping
 * providers is one adapter, never a change to the prompts or orchestration.
 */

/** A fully-assembled request: a system instruction plus the user prompt. */
export interface NarrationRequest {
  /** Role and rules for the model (the versioned prompt's system text). */
  systemInstruction: string;
  /** The user-turn prompt, including the structured physics context. */
  userPrompt: string;
}

/**
 * A text-generation client. Implementations call a model and return its
 * prose. They never parse it into simulation values (ADR-003).
 */
export interface NarrationClient {
  generate: (request: NarrationRequest) => Promise<string>;
}
