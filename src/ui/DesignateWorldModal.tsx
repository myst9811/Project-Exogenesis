/**
 * @module ui/DesignateWorldModal
 *
 * Modal for naming ("designating") the current world. Shows the immutable
 * designation and a few readouts so the user confirms which world they are
 * naming, then captures a cosmetic common name. Optionally offers AI name
 * suggestions: picking one fills the input (the user may still edit). Pure
 * presentational — it owns only the input text and calls handlers; the AI
 * async and validation diagnostics come from the parent (CLAUDE.md §4).
 */

import { useState } from 'react';
import type { JSX } from 'react';

import type { NameSuggestion } from '../types/ai';
import type { SimulationDiagnostic } from '../types/configuration';

export interface DesignateReadouts {
  surfaceTemperatureKelvin: number;
  surfaceGravityEarthG: number;
  hzLabel: string;
}

export function DesignateWorldModal({
  designation,
  readouts,
  initialName,
  diagnostics,
  suggestions = [],
  suggestStatus = 'idle',
  onRequestSuggestions,
  onConfirm,
  onCancel,
}: {
  designation: string;
  readouts: DesignateReadouts;
  initialName: string;
  diagnostics: readonly SimulationDiagnostic[];
  suggestions?: readonly NameSuggestion[];
  suggestStatus?: 'idle' | 'generating' | 'error';
  onRequestSuggestions?: () => void;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}): JSX.Element {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal designate-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Designate world"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <p className="modal-eyebrow">SUBSYSTEM 09 · EXPLORATION LOG</p>
        <h2 className="modal-title">Designate World</h2>
        <p className="designate-designation">{designation}</p>
        <div className="designate-readouts">
          <span>{Math.round(readouts.surfaceTemperatureKelvin)} K</span>
          <span>{readouts.surfaceGravityEarthG.toFixed(2)} g</span>
          <span>{readouts.hzLabel}</span>
        </div>
        <label className="designate-field">
          <span>Common name</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Aurelia"
            maxLength={40}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </label>

        {onRequestSuggestions !== undefined && (
          <div className="designate-suggest">
            <button
              type="button"
              className="tactical-btn"
              disabled={suggestStatus === 'generating'}
              onClick={onRequestSuggestions}
            >
              {suggestStatus === 'generating' ? 'Suggesting…' : '✦ Suggest names'}
            </button>
            {suggestStatus === 'error' && (
              <p className="designate-suggest__error">
                Couldn&rsquo;t fetch suggestions — type a name instead.
              </p>
            )}
            {suggestions.length > 0 && (
              <>
                <p className="designate-suggest__header">PROVISIONAL DESIGNATIONS (SUGGESTED)</p>
                <ul className="designate-suggest__list">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.name}>
                      <button
                        type="button"
                        className="designate-suggest__item"
                        onClick={() => {
                          setName(suggestion.name);
                        }}
                      >
                        <span className="designate-suggest__name">{suggestion.name}</span>
                        {suggestion.rationale.length > 0 && (
                          <span className="designate-suggest__rationale">{suggestion.rationale}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {diagnostics.map((diagnostic) => (
          <p key={diagnostic.parameter + diagnostic.message} className="designate-error" role="alert">
            {diagnostic.message}
          </p>
        ))}
        <div className="modal-actions">
          <button type="button" className="tactical-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="tactical-btn accent"
            disabled={trimmed.length === 0}
            onClick={() => {
              onConfirm(trimmed);
            }}
          >
            Designate
          </button>
        </div>
      </div>
    </div>
  );
}
