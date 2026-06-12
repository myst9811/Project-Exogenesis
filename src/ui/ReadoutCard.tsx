/**
 * @module ui/ReadoutCard
 *
 * Presents one computed property as a felt experience (CLAUDE.md §15): the
 * brief label, the narrative sentence, an Earth comparison, and — always —
 * the raw physical value beneath, so the translation supplements the number
 * rather than hiding it.
 *
 * Two modes: a full translation card (the physics readouts), or an
 * instrument card carrying just a `brief` line plus a visual (habitability,
 * atmosphere). An optional `tone` colors the card's status rule.
 */

import type { JSX, ReactNode } from 'react';

import type { HumanTranslation } from '../translation';

export type ReadoutTone = 'nominal' | 'caution' | 'critical' | 'accent';

export function ReadoutCard({
  label,
  translation,
  brief,
  tone,
  rawValue,
  instrument,
}: {
  label: string;
  /** Full felt-experience translation (physics readouts). */
  translation?: HumanTranslation;
  /** Standalone brief line, when there is no full translation. */
  brief?: string;
  /** Status tone for the card's left rule. */
  tone?: ReadoutTone;
  rawValue: string;
  /** Optional scientific-instrument visual (gauge, spectrum, bar). */
  instrument?: ReactNode;
}): JSX.Element {
  const briefText = translation?.brief ?? brief;
  const toneClass = tone === undefined ? '' : ` readout-tone-${tone}`;

  return (
    <article className={`readout-card${toneClass}`}>
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
      {briefText !== undefined && <p className="readout-brief">{briefText}</p>}
      {instrument !== undefined && <div className="readout-instrument">{instrument}</div>}
      {translation !== undefined && <p className="readout-narrative">{translation.narrative}</p>}
      {translation?.earthComparison !== undefined && (
        <p className="readout-comparison">{translation.earthComparison}</p>
      )}
    </article>
  );
}
