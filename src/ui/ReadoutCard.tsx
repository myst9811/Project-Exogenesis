/**
 * @module ui/ReadoutCard
 *
 * Presents one computed property as a felt experience (CLAUDE.md §15): the
 * brief label, the narrative sentence, an Earth comparison, and — always —
 * the raw physical value beneath, so the translation supplements the number
 * rather than hiding it.
 */

import type { JSX } from 'react';

import type { HumanTranslation } from '../translation';

export function ReadoutCard({
  label,
  translation,
  rawValue,
}: {
  label: string;
  translation: HumanTranslation;
  rawValue: string;
}): JSX.Element {
  return (
    <article className="readout-card">
      <h3 className="readout-label">{label}</h3>
      <p className="readout-brief">{translation.brief}</p>
      <p className="readout-narrative">{translation.narrative}</p>
      {translation.earthComparison !== undefined && (
        <p className="readout-comparison">{translation.earthComparison}</p>
      )}
      <p className="readout-raw" aria-label="raw value">
        {rawValue}
      </p>
    </article>
  );
}
