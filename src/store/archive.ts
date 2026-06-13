/**
 * @module store/archive
 *
 * The Exploration Archive store: the user's saved, named worlds (CLAUDE.md
 * §4 — a fourth, UI-only state layer that never feeds physics). CRUD plus
 * sorted/filtered listing over `WorldArchiveEntry` records keyed by
 * `configurationHash`. An optional persistence hook is invoked after every
 * mutation so the app can write through to storage.
 */

import { createStore, type Store } from './createStore';
import { validateCommonName } from './archiveValidation';
import {
  ARCHIVE_SCHEMA_VERSION,
  type ArchiveSortKey,
  type ArchiveState,
  type CatalogSnapshot,
  type WorldArchiveEntry,
} from '../types/archive';
import type { SimulationDiagnostic } from '../types/configuration';

/** Soft warning threshold; the UI nudges the user to prune past this. */
export const ARCHIVE_SOFT_WARN_AT = 180;
/** Hard cap; designating beyond this is refused (no silent eviction). */
export const ARCHIVE_HARD_CAP = 200;

/** Input for designating (saving) the current world. */
export interface DesignateInput {
  configurationHash: string;
  commonName: string;
  shareToken: string;
  catalogSnapshot: CatalogSnapshot;
}

/** The archive store: pub/sub state plus CRUD and listing actions. */
export interface ArchiveStore extends Store<ArchiveState> {
  designate: (input: DesignateInput) => readonly SimulationDiagnostic[];
  rename: (configurationHash: string, commonName: string) => readonly SimulationDiagnostic[];
  remove: (configurationHash: string) => void;
  setActive: (configurationHash: string | null) => void;
  list: (sort: ArchiveSortKey, filter?: string) => readonly WorldArchiveEntry[];
  isNearCapacity: () => boolean;
}

function capacityDiagnostic(): SimulationDiagnostic {
  return {
    severity: 'error',
    parameter: 'archive.capacity',
    message: `Your archive is full (${ARCHIVE_HARD_CAP} worlds). Delete one to designate a new world.`,
    explanation: 'The archive never removes a named world automatically.',
  };
}

/**
 * Creates the archive store.
 *
 * @param initialState - Seed state (e.g. hydrated from storage)
 * @param onChange - Invoked after every committed mutation (for persistence)
 * @returns An {@link ArchiveStore}
 */
export function createArchiveStore(
  initialState?: ArchiveState,
  onChange?: (state: ArchiveState) => void,
): ArchiveStore {
  const store = createStore<ArchiveState>(
    initialState ?? {
      schemaVersion: ARCHIVE_SCHEMA_VERSION,
      entries: {},
      activeHash: null,
      hydrated: true,
    },
  );

  if (onChange) {
    store.subscribe(() => {
      onChange(store.getState());
    });
  }

  const designate = (input: DesignateInput): readonly SimulationDiagnostic[] => {
    const validation = validateCommonName(input.commonName);
    if (!validation.ok) {
      return [validation.diagnostic];
    }
    const state = store.getState();
    const existing = state.entries[input.configurationHash];
    if (existing === undefined && Object.keys(state.entries).length >= ARCHIVE_HARD_CAP) {
      return [capacityDiagnostic()];
    }
    const now = new Date().toISOString();
    const entry: WorldArchiveEntry = {
      configurationHash: input.configurationHash,
      commonName: validation.value,
      shareToken: input.shareToken,
      designatedAt: existing?.designatedAt ?? now,
      updatedAt: now,
      catalogSnapshot: input.catalogSnapshot,
    };
    store.setState((previous) => ({
      ...previous,
      entries: { ...previous.entries, [entry.configurationHash]: entry },
      activeHash: entry.configurationHash,
    }));
    return [];
  };

  const rename = (
    configurationHash: string,
    commonName: string,
  ): readonly SimulationDiagnostic[] => {
    const validation = validateCommonName(commonName);
    if (!validation.ok) {
      return [validation.diagnostic];
    }
    const existing = store.getState().entries[configurationHash];
    if (existing === undefined) {
      return [];
    }
    store.setState((previous) => ({
      ...previous,
      entries: {
        ...previous.entries,
        [configurationHash]: {
          ...existing,
          commonName: validation.value,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    return [];
  };

  const remove = (configurationHash: string): void => {
    store.setState((previous) => {
      const next = { ...previous.entries };
      delete next[configurationHash];
      return {
        ...previous,
        entries: next,
        activeHash: previous.activeHash === configurationHash ? null : previous.activeHash,
      };
    });
  };

  const setActive = (configurationHash: string | null): void => {
    store.setState((previous) => ({ ...previous, activeHash: configurationHash }));
  };

  const list = (sort: ArchiveSortKey, filter?: string): readonly WorldArchiveEntry[] => {
    const query = (filter ?? '').trim().toLowerCase();
    const entries = Object.values(store.getState().entries).filter((entry) => {
      if (query.length === 0) {
        return true;
      }
      return (
        entry.commonName.toLowerCase().includes(query) ||
        entry.configurationHash.toLowerCase().includes(query)
      );
    });
    const sorted = [...entries];
    if (sort === 'name') {
      sorted.sort((a, b) => a.commonName.localeCompare(b.commonName));
    } else if (sort === 'survivability') {
      sorted.sort(
        (a, b) => b.catalogSnapshot.survivabilityScore - a.catalogSnapshot.survivabilityScore,
      );
    } else {
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return sorted;
  };

  const isNearCapacity = (): boolean =>
    Object.keys(store.getState().entries).length >= ARCHIVE_SOFT_WARN_AT;

  return { ...store, designate, rename, remove, setActive, list, isNearCapacity };
}
