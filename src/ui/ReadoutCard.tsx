/**
 * @module ui/ReadoutCard
 *
 * Presents one computed property as a felt experience (CLAUDE.md §15): the
 * brief label, the narrative sentence, an Earth comparison, and — always —
 * the raw physical value beneath, so the translation supplements the number
 * rather than hiding it.
 */

import type { JSX, ReactNode } from 'react';

import type { HumanTranslation } from '../translation';

export function ReadoutCard({
  label,
  translation,
  rawValue,
  instrument,
}: {
  label: string;
  translation: HumanTranslation;
  rawValue: string;
  /** Optional scientific-instrument visual (gauge, spectrum) for this readout. */
  instrument?: ReactNode;
}): JSX.Element {
  return (
    <article className="readout-card">
      <header className="readout-head">
        <h3 className="readout-label">
          <span aria-hidden="true" className="readout-glyph">
            ◈
          </span>
          {label}
        </h3>
        <p className="readout-raw" aria-label="raw value">
          {rawValue}
        </p>
      </header>
      <p className="readout-brief">{translation.brief}</p>
      {instrument !== undefined && <div className="readout-instrument">{instrument}</div>}
      <p className="readout-narrative">{translation.narrative}</p>
      {translation.earthComparison !== undefined && (
        <p className="readout-comparison">{translation.earthComparison}</p>
      )}
    </article>
  );
}
