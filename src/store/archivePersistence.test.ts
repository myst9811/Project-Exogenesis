/**
 * @module store/archivePersistence.test
 */

import { describe, expect, it } from 'vitest';

import { loadArchive, saveArchive, type KeyValueStore } from './archivePersistence';
import type { ArchiveState, WorldArchiveEntry } from '../types/archive';

function memoryStore(seed: Record<string, string> = {}): KeyValueStore {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

const entry: WorldArchiveEntry = {
  configurationHash: 'a3f2b1ffffff',
  commonName: 'Aurelia',
  shareToken: 'tok',
  designatedAt: '2026-06-14T00:00:00.000Z',
  updatedAt: '2026-06-14T00:00:00.000Z',
  catalogSnapshot: {
    spectralClass: 'G',
    semiMajorAxisAu: 1,
    surfaceTemperatureKelvin: 288,
    surfaceGravityEarthG: 1,
    survivabilityScore: 100,
    habitableZonePosition: 'inside-optimistic',
    limitingFactor: 'thermal',
  },
};

describe('archive persistence', () => {
  it('returns an empty archive when storage has nothing', () => {
    const state = loadArchive(memoryStore());
    expect(state.entries).toEqual({});
    expect(state.hydrated).toBe(true);
  });

  it('round-trips entries through save and load', () => {
    const store = memoryStore();
    const state: ArchiveState = {
      schemaVersion: '1.0.0',
      entries: { [entry.configurationHash]: entry },
      activeHash: null,
      hydrated: true,
    };
    saveArchive(store, state);
    const loaded = loadArchive(store);
    expect(loaded.entries[entry.configurationHash]?.commonName).toBe('Aurelia');
  });

  it('returns an empty archive when stored JSON is corrupt', () => {
    const state = loadArchive(memoryStore({ 'exogenesis.archive.v1': '{not json' }));
    expect(state.entries).toEqual({});
    expect(state.hydrated).toBe(true);
  });

  it('does not throw when setItem throws (quota exceeded)', () => {
    const throwing: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const state: ArchiveState = {
      schemaVersion: '1.0.0',
      entries: {},
      activeHash: null,
      hydrated: true,
    };
    expect(() => {
      saveArchive(throwing, state);
    }).not.toThrow();
  });
});
