/**
 * @module store/archiveValidation.test
 */

import { describe, expect, it } from 'vitest';

import { resolveDisplayName, validateCommonName } from './archiveValidation';
import type { ArchiveState, WorldArchiveEntry } from '../types/archive';

function entryFor(hash: string, name: string): WorldArchiveEntry {
  return {
    configurationHash: hash,
    commonName: name,
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
}

function stateWith(entry?: WorldArchiveEntry): ArchiveState {
  return {
    schemaVersion: '1.0.0',
    entries: entry ? { [entry.configurationHash]: entry } : {},
    activeHash: null,
    hydrated: true,
  };
}

describe('validateCommonName', () => {
  it('accepts a simple name and trims surrounding whitespace', () => {
    const result = validateCommonName('  Aurelia  ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('Aurelia');
    }
  });

  it('accepts international letters, digits, spaces, hyphen, apostrophe', () => {
    expect(validateCommonName("Zephyr-9 d'Or").ok).toBe(true);
    expect(validateCommonName('Æthel Bjørn').ok).toBe(true);
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(validateCommonName('').ok).toBe(false);
    expect(validateCommonName('   ').ok).toBe(false);
  });

  it('rejects names longer than 40 characters after trim', () => {
    expect(validateCommonName('a'.repeat(41)).ok).toBe(false);
    expect(validateCommonName('a'.repeat(40)).ok).toBe(true);
  });

  it('rejects HTML/control characters and URLs', () => {
    expect(validateCommonName('<script>').ok).toBe(false);
    expect(validateCommonName('a"b').ok).toBe(false);
    expect(validateCommonName('a&b').ok).toBe(false);
    expect(validateCommonName('http://x.com').ok).toBe(false);
    expect(validateCommonName('#tag').ok).toBe(false);
  });

  it('rejects names that impersonate a system designation', () => {
    expect(validateCommonName('EXO-A3F2B1').ok).toBe(false);
    expect(validateCommonName('exo-a3f2b1').ok).toBe(false);
  });

  it('returns a diagnostic message when invalid', () => {
    const result = validateCommonName('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.severity).toBe('error');
      expect(result.diagnostic.message.length).toBeGreaterThan(0);
    }
  });
});

describe('resolveDisplayName', () => {
  it('returns the designation and null common name when no hash', () => {
    expect(resolveDisplayName(stateWith(), null)).toEqual({
      designation: null,
      commonName: null,
    });
  });

  it('derives the EXO designation from the hash prefix', () => {
    const r = resolveDisplayName(stateWith(), 'a3f2b1ffffff');
    expect(r.designation).toBe('EXO-A3F2B1');
    expect(r.commonName).toBeNull();
  });

  it('returns the saved common name when an entry exists', () => {
    const entry = entryFor('a3f2b1ffffff', 'Aurelia');
    const r = resolveDisplayName(stateWith(entry), 'a3f2b1ffffff');
    expect(r.commonName).toBe('Aurelia');
    expect(r.designation).toBe('EXO-A3F2B1');
  });
});
