/**
 * @module ai/namer
 *
 * Suggests cosmetic common names for a computed world (CLAUDE.md §7 — names
 * are permitted flavor text). Read-only: it builds context, asks the client,
 * and parses the prose into validated name candidates. `parseNameSuggestions`
 * is the trust boundary for model output — every name must pass the same
 * `validateCommonName` guard the user's own input does, so the model can never
 * introduce an unsafe or designation-impersonating string.
 */

import type { NameSuggestion } from '../types/ai';
import { validateCommonName } from '../store/archiveValidation';

const MAX_SUGGESTIONS = 3;

/**
 * Parses the model's reply into validated name suggestions. Each line is
 * `Name — rationale` (em dash) or `Name - rationale` (spaced hyphen). Names
 * that fail validation are dropped; the result is capped at three and may be
 * empty if the model misbehaved.
 *
 * @param raw - The raw model reply
 * @returns Up to three validated {@link NameSuggestion}s
 */
export function parseNameSuggestions(raw: string): NameSuggestion[] {
  const suggestions: NameSuggestion[] = [];
  for (const line of raw.split('\n')) {
    if (suggestions.length >= MAX_SUGGESTIONS) {
      break;
    }
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
      continue;
    }
    const separatorMatch = /\s[—–]\s|\s-\s/.exec(trimmedLine);
    const namePart = separatorMatch ? trimmedLine.slice(0, separatorMatch.index) : trimmedLine;
    const rationalePart = separatorMatch
      ? trimmedLine.slice(separatorMatch.index + separatorMatch[0].length)
      : '';
    const validation = validateCommonName(namePart);
    if (!validation.ok) {
      continue;
    }
    suggestions.push({ name: validation.value, rationale: rationalePart.trim() });
  }
  return suggestions;
}
