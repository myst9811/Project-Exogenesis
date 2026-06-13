/**
 * @module ui/WorldArchiveCard
 *
 * One saved world in the Exploration Archive. Renders the common name, the
 * honest designation, and a few "as cataloged" readouts from the snapshot,
 * with load / rename / delete / copy-link actions. Delete is guarded by an
 * inline confirm. Pure presentational; all actions are callbacks.
 */

import { useState } from 'react';
import type { JSX } from 'react';

import type { WorldArchiveEntry } from '../types/archive';
import { WorldIdentity } from './WorldIdentity';

export function WorldArchiveCard({
  entry,
  isActive,
  onLoad,
  onRename,
  onDelete,
  onCopyLink,
}: {
  entry: WorldArchiveEntry;
  isActive: boolean;
  onLoad: (entry: WorldArchiveEntry) => void;
  onRename: (entry: WorldArchiveEntry) => void;
  onDelete: (entry: WorldArchiveEntry) => void;
  onCopyLink: (entry: WorldArchiveEntry) => void;
}): JSX.Element {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const designation = `EXO-${entry.configurationHash.slice(0, 6).toUpperCase()}`;
  const snapshot = entry.catalogSnapshot;

  return (
    <li className={`archive-card ${isActive ? 'is-active' : ''}`}>
      <WorldIdentity designation={designation} commonName={entry.commonName} size="card" />
      <div className="archive-card__readouts">
        <span>{Math.round(snapshot.surfaceTemperatureKelvin)} K</span>
        <span>{snapshot.surfaceGravityEarthG.toFixed(2)} g</span>
        <span>
          {snapshot.spectralClass}-type · {snapshot.semiMajorAxisAu.toFixed(2)} AU
        </span>
        <span>{Math.round(snapshot.survivabilityScore)}/100</span>
      </div>
      <div className="archive-card__actions">
        <button
          type="button"
          className="tactical-btn accent"
          onClick={() => {
            onLoad(entry);
          }}
        >
          Load
        </button>
        <button
          type="button"
          className="tactical-btn"
          onClick={() => {
            onRename(entry);
          }}
        >
          Rename
        </button>
        <button
          type="button"
          className="tactical-btn"
          onClick={() => {
            onCopyLink(entry);
          }}
        >
          Copy link
        </button>
        {confirmingDelete ? (
          <button
            type="button"
            className="tactical-btn danger"
            onClick={() => {
              onDelete(entry);
            }}
          >
            Confirm delete
          </button>
        ) : (
          <button
            type="button"
            className="tactical-btn"
            onClick={() => {
              setConfirmingDelete(true);
            }}
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}
