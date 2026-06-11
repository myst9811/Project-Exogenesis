/**
 * @module types/ai
 *
 * Output contract of the AI explanation layer (CLAUDE.md §7, ADR-003). The
 * AI layer is a read-only explainer of computed physics: it describes,
 * explains, and (clearly labeled) speculates — it never produces, overrides,
 * or influences simulation values. Every output is typed by kind so the UI
 * can present speculation distinctly.
 */

/**
 * The kind of AI content, which determines how the UI presents it:
 *   - `description`: narration of the computed world as it would be experienced
 *   - `explanation`: the physical mechanism behind a computed value
 *   - `speculation`: extrapolation beyond what physics computed (labeled)
 */
export type AIContentKind = 'description' | 'explanation' | 'speculation';

/** A single piece of AI-generated content, tagged by kind. */
export interface AIContent {
  kind: AIContentKind;
  /** The model's prose. Never contains authoritative simulation values. */
  text: string;
  /**
   * Present only for `speculation`: the basis for the extrapolation, so the
   * UI can show *why* it is speculative rather than computed.
   */
  speculationBasis?: string;
}

/** Lifecycle status of an asynchronous AI generation, for UI loading states. */
export type AIRequestStatus = 'idle' | 'generating' | 'ready' | 'error';
