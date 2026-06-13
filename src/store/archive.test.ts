/**
 * @module store/archive.test
 */

import { describe, expect, it } from 'vitest';

import { ARCHIVE_HARD_CAP, ARCHIVE_SOFT_WARN_AT, createArchiveStore } from './archive';
import type { CatalogSnapshot } from '../types/archive';

const snapshot: CatalogSnapshot = {
  spectralClass: 'G',
  semiMajorAxisAu: 1,
  surfaceTemperatureKelvin: 288,
  surfaceGravityEarthG: 1,
  survivabilityScore: 100,
  habitableZonePosition: 'inside-optimistic',
  limitingFactor: 'thermal',
};

function designateArgs(hash: string, name: string): {
  configurationHash: string;
  commonName: string;
  shareToken: string;
  catalogSnapshot: CatalogSnapshot;
} {
  return { configurationHash: hash, commonName: name, shareToken: `tok-${hash}`, catalogSnapshot: snapshot };
}

describe('createArchiveStore', () => {
  it('designates a world and stores it by hash', () => {
    const store = createArchiveStore();
    const diagnostics = store.designate(designateArgs('h1', 'Aurelia'));
    expect(diagnostics).toEqual([]);
    expect(store.getState().entries.h1?.commonName).toBe('Aurelia');
    expect(store.getState().activeHash).toBe('h1');
  });

  it('rejects an invalid name with a diagnostic and saves nothing', () => {
    const store = createArchiveStore();
    const diagnostics = store.designate(designateArgs('h1', '   '));
    expect(diagnostics.length).toBe(1);
    expect(store.getState().entries.h1).toBeUndefined();
  });

  it('upserts in place for the same hash, preserving designatedAt', () => {
    const store = createArchiveStore();
    store.designate(designateArgs('h1', 'First'));
    const firstAt = store.getState().entries.h1?.designatedAt;
    store.designate(designateArgs('h1', 'Second'));
    expect(store.getState().entries.h1?.commonName).toBe('Second');
    expect(store.getState().entries.h1?.designatedAt).toBe(firstAt);
  });

  it('renames an existing entry', () => {
    const store = createArchiveStore();
    store.designate(designateArgs('h1', 'First'));
    store.rename('h1', 'Renamed');
    expect(store.getState().entries.h1?.commonName).toBe('Renamed');
  });

  it('removes an entry', () => {
    const store = createArchiveStore();
    store.designate(designateArgs('h1', 'Aurelia'));
    store.remove('h1');
    expect(store.getState().entries.h1).toBeUndefined();
  });

  it('lists entries sorted by name and filters by substring', () => {
    const store = createArchiveStore();
    store.designate(designateArgs('h1', 'Zephyr'));
    store.designate(designateArgs('h2', 'Aurelia'));
    expect(store.list('name').map((e) => e.commonName)).toEqual(['Aurelia', 'Zephyr']);
    expect(store.list('recent', 'zep').map((e) => e.commonName)).toEqual(['Zephyr']);
  });

  it('refuses to add beyond the hard cap and returns a diagnostic', () => {
    const store = createArchiveStore();
    for (let i = 0; i < ARCHIVE_HARD_CAP; i++) {
      expect(store.designate(designateArgs(`h${i}`, `World ${i}`))).toEqual([]);
    }
    const diagnostics = store.designate(designateArgs('overflow', 'Too Many'));
    expect(diagnostics.length).toBe(1);
    expect(store.getState().entries.overflow).toBeUndefined();
  });

  it('exposes whether the soft-warn threshold is reached', () => {
    const store = createArchiveStore();
    expect(store.isNearCapacity()).toBe(false);
    expect(ARCHIVE_SOFT_WARN_AT).toBeLessThan(ARCHIVE_HARD_CAP);
  });
});
