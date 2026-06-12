/**
 * @module ui/SpectralClassSelector
 *
 * A tactical segmented control for the Morgan–Keenan spectral class — one
 * button per class, the active one highlighted. A generic, presentational
 * single-select: it takes the current value, the options, and an onChange.
 */

import type { JSX } from 'react';

import type { SpectralClass } from '../types/configuration';

export function SpectralClassSelector({
  value,
  options,
  onChange,
}: {
  value: SpectralClass;
  options: readonly SpectralClass[];
  onChange: (value: SpectralClass) => void;
}): JSX.Element {
  return (
    <div className="segmented" role="radiogroup" aria-label="Spectral class">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          className={`segmented-option${option === value ? ' is-active' : ''}`}
          onClick={() => {
            if (option !== value) {
              onChange(option);
            }
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
