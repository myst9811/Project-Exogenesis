/**
 * @module ui/NumberField
 *
 * A controlled numeric input that commits on blur or Enter, not on every
 * keystroke — so one deliberate edit produces one recompute and one history
 * entry. Invalid or unchanged entries revert to the committed value.
 */

import { useEffect, useState } from 'react';
import type { JSX } from 'react';

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

  return (
    <label className="number-field">
      <span className="field-label">{unit === undefined ? label : `${label} (${unit})`}</span>
      <input
        type="number"
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
    </label>
  );
}
