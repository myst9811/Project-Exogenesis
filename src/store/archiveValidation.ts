/**
 * @module store/archiveValidation
 *
 * Pure helpers for the Exploration Archive: validating user-chosen common
 * names and resolving which names to display for a world. No DOM, no storage,
 * no physics — unit-testable in isolation (CLAUDE.md §11).
 */

import type { SimulationDiagnostic } from '../types/configuration';

/** A validated name, or the diagnostic explaining why it was rejected. */
export type NameValidation =
  | { ok: true; value: string }
  | { ok: false; diagnostic: SimulationDiagnostic };

const MAX_NAME_LENGTH = 40;
/** Letters (any script), digits, spaces, hyphen, apostrophe. */
const ALLOWED_NAME = /^[\p{L}\p{N} '-]+$/u;
const DESIGNATION_SHAPE = /^EXO-[0-9A-F]{6}$/i;

function invalid(message: string): NameValidation {
  return {
    ok: false,
    diagnostic: {
      severity: 'error',
      parameter: 'archive.commonName',
      message,
      explanation: 'A common name is cosmetic and must be safe to display as text.',
    },
  };
}

/**
 * Validates a user-chosen common name, returning the trimmed value or a
 * diagnostic. Rejects empties, over-long names, HTML/control characters,
 * URLs, and strings that impersonate an `EXO-` system designation.
 *
 * @param raw - The raw input string
 * @returns A {@link NameValidation}
 */
export function validateCommonName(raw: string): NameValidation {
  const name = raw.trim();
  if (name.length === 0) {
    return invalid('Enter a name for this world.');
  }
  if (name.length > MAX_NAME_LENGTH) {
    return invalid(`Names must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }
  if (DESIGNATION_SHAPE.test(name)) {
    return invalid('That looks like a system designation. Choose a different common name.');
  }
  if (!ALLOWED_NAME.test(name)) {
    return invalid('Use only letters, numbers, spaces, hyphens, and apostrophes.');
  }
  return { ok: true, value: name };
}
