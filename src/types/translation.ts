/**
 * @module types/translation
 *
 * The human-experience translation contract (CLAUDE.md §15). The
 * translation layer converts a computed physics value into a felt
 * description. It supplements the raw value — it never replaces it; the
 * caller retains the original number and the UI shows both.
 */

export interface HumanTranslation {
  /** Short phrase for UI labels. */
  brief: string;
  /** Full sentence for narrative descriptions. */
  narrative: string;
  /** Comparison anchor to a familiar Earth reference. */
  earthComparison?: string;
}
