/**
 * @module store/archivePersistence
 *
 * Reads and writes the Exploration Archive to a key/value store (browser
 * `localStorage` in production; an in-memory fake in tests). All failure
 * modes are swallowed into a safe default — corrupt data or a write that
 * exceeds quota must never crash the app (CLAUDE.md §19). Decode is a trust
 * boundary: malformed storage yields an empty archive.
 */

import { ARCHIVE_SCHEMA_VERSION, type ArchiveState, type WorldArchiveEntry } from '../types/archive';

/** The slice of the Web Storage API this module needs. */
export interface KeyValueStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const STORAGE_KEY = 'exogenesis.archive.v1';

/** The on-disk envelope: a version plus entries as an array for stable JSON. */
interface ArchiveEnvelope {
  v: string;
  entries: WorldArchiveEntry[];
}

function emptyState(): ArchiveState {
  return { schemaVersion: ARCHIVE_SCHEMA_VERSION, entries: {}, activeHash: null, hydrated: true };
}

/**
 * Loads the archive from storage, returning an empty (but hydrated) archive
 * if nothing is stored or the stored data is unreadable.
 *
 * @param storage - The key/value store to read from
 * @returns The hydrated archive state
 */
export function loadArchive(storage: KeyValueStore): ArchiveState {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    return emptyState();
  }
  try {
    const parsed = JSON.parse(raw) as ArchiveEnvelope;
    if (!Array.isArray(parsed.entries)) {
      return emptyState();
    }
    const entries: Record<string, WorldArchiveEntry> = {};
    for (const entry of parsed.entries) {
      if (typeof entry.configurationHash === 'string' && typeof entry.commonName === 'string') {
        entries[entry.configurationHash] = entry;
      }
    }
    return { schemaVersion: ARCHIVE_SCHEMA_VERSION, entries, activeHash: null, hydrated: true };
  } catch {
    return emptyState();
  }
}

/**
 * Persists the archive to storage. Swallows write errors (e.g. quota
 * exceeded) so a failed save never propagates to the UI.
 *
 * @param storage - The key/value store to write to
 * @param state - The archive state to persist
 */
export function saveArchive(storage: KeyValueStore, state: ArchiveState): void {
  const envelope: ArchiveEnvelope = {
    v: ARCHIVE_SCHEMA_VERSION,
    entries: Object.values(state.entries),
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage full or unavailable; the in-memory archive remains authoritative.
  }
}
