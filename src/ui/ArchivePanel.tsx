/**
 * @module ui/ArchivePanel
 *
 * The Exploration Archive browser: search, sort, and act on saved worlds.
 * Reads the archive store reactively and dispatches its CRUD actions; loading
 * is delegated to the parent (which routes through the existing token path).
 * Rename uses a simple inline prompt; delete is confirmed inside each card.
 */

import { useState } from 'react';
import type { JSX } from 'react';

import type { ArchiveSortKey, WorldArchiveEntry } from '../types/archive';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';
import { WorldArchiveCard } from './WorldArchiveCard';

export function ArchivePanel({
  onClose,
  onLoad,
}: {
  onClose: () => void;
  onLoad: (entry: WorldArchiveEntry) => void;
}): JSX.Element {
  const { archive } = useStores();
  const archiveState = useStore(archive);
  const [sort, setSort] = useState<ArchiveSortKey>('recent');
  const [filter, setFilter] = useState('');
  const entries = archive.list(sort, filter);
  const hasAny = Object.keys(archiveState.entries).length > 0;

  return (
    <aside className="archive-panel" aria-label="exploration archive">
      <div className="archive-panel__header">
        <p className="modal-eyebrow">SUBSYSTEM 09 · EXPLORATION LOG</p>
        <h2 className="modal-title">Exploration Archive</h2>
        <button type="button" className="tactical-btn" aria-label="Close archive" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="archive-panel__controls">
        <input
          type="search"
          aria-label="Search archive"
          placeholder="Search name or designation"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
          }}
        />
        <select
          aria-label="Sort archive"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as ArchiveSortKey);
          }}
        >
          <option value="recent">Recent</option>
          <option value="name">Name A–Z</option>
          <option value="survivability">Survivability</option>
        </select>
      </div>
      {!hasAny ? (
        <p className="archive-panel__empty">
          No worlds archived yet. Designate a world to begin your log.
        </p>
      ) : (
        <ul className="archive-panel__list">
          {entries.map((entry) => (
            <WorldArchiveCard
              key={entry.configurationHash}
              entry={entry}
              isActive={entry.configurationHash === archiveState.activeHash}
              onLoad={onLoad}
              onRename={(target) => {
                const next = window.prompt('Rename world', target.commonName);
                if (next !== null) {
                  archive.rename(target.configurationHash, next);
                }
              }}
              onDelete={(target) => {
                archive.remove(target.configurationHash);
              }}
              onCopyLink={(target) => {
                void navigator.clipboard?.writeText(
                  `${window.location.origin}${window.location.pathname}#w=${target.shareToken}&n=${encodeURIComponent(target.commonName)}`,
                );
              }}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
