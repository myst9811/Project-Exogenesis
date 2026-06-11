/**
 * @module ui/NumberField
 *
 * A step-flanked tactical numeric field. The − / + buttons nudge the
 * committed value by one step (clamped to min/max) and commit immediately;
 * the central input commits on blur or Enter — so one deliberate edit
 * produces one recompute and one history entry. Invalid or unchanged entries
 * revert to the committed value.
 *
 * The input is named via `aria-label` (not a wrapping label) so the step
 * buttons' glyphs do not pollute its accessible name.
 */

import { useEffect, useState } from 'react';
import type { JSX } from 'react';

/** Decimal places implied by a step, so nudging avoids float noise. */
function decimalsOf(step: number): number {
  const fraction = String(step).split('.')[1];
  return fraction === undefined ? 0 : fraction.length;
}

export function NumberField({
  label,
  value,
  unit,
  min,
  max,
  step,
  onCommit,
}: {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (value: number) => void;
}): JSX.Element {
  const [draft, setDraft] = useState(String(value));
  const fullLabel = unit === undefined ? label : `${label} (${unit})`;

  // Re-sync the draft whenever the committed value changes (e.g. undo/redo).
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (): void => {
    const parsed = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(parsed) && parsed !== value) {
      onCommit(parsed);
    } else {
      setDraft(String(value));
    }
  };

  const nudge = (direction: 1 | -1): void => {
    const delta = step ?? 1;
    let next = value + direction * delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    next = Number(next.toFixed(decimalsOf(delta)));
    if (next !== value) {
      onCommit(next);
    }
  };

  return (
    <div className="tactical-field">
      <span className="field-label">{fullLabel}</span>
      <div className="field-input-group">
        <button
          type="button"
          className="step-btn"
          aria-label={`Decrease ${label}`}
          onClick={() => {
            nudge(-1);
          }}
        >
          −
        </button>
        <input
          type="number"
          className="tactical-input"
          aria-label={fullLabel}
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commit();
            }
          }}
        />
        <button
          type="button"
          className="step-btn"
          aria-label={`Increase ${label}`}
          onClick={() => {
            nudge(1);
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
