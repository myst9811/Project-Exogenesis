/**
 * @module physics/configuration/url.test
 */

import { describe, expect, it } from 'vitest';

import type { PlanetConfiguration } from '../../types/configuration';
import { PLANETARY_STATE_SCHEMA_VERSION } from '../../types/physics';
import { createEarthBaselineConfiguration } from './earthBaseline';
import { canonicalizeForHashing } from './manifest';
import type { ConfigurationMigration } from './migrations';
import { decodeConfiguration, encodeConfiguration, migrateConfiguration } from './url';

/** Encodes an arbitrary envelope object the way the URL layer does (test helper). */
function encodeEnvelope(envelope: unknown): string {
  const json = canonicalizeForHashing(envelope);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('encodeConfiguration / decodeConfiguration round-trip', () => {
  it('round-trips the Earth baseline to an equal configuration', () => {
    const original = createEarthBaselineConfiguration();
    const result = decodeConfiguration(encodeConfiguration(original));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.configuration).toEqual(original);
    }
  });

  it('produces a URL-safe token (no +, /, or = padding)', () => {
    const token = encodeConfiguration(createEarthBaselineConfiguration());
    expect(token).not.toMatch(/[+/=]/);
  });

  it('is deterministic and key-order-independent (same token for reordered input)', () => {
    const baseline = createEarthBaselineConfiguration();
    const reordered: PlanetConfiguration = {
      atmosphere: baseline.atmosphere,
      rotation: baseline.rotation,
      planetary: baseline.planetary,
      orbital: baseline.orbital,
      stellar: baseline.stellar,
    };
    expect(encodeConfiguration(reordered)).toBe(encodeConfiguration(baseline));
  });

  it('satisfies the token→config→token identity property', () => {
    const token = encodeConfiguration(createEarthBaselineConfiguration());
    const decoded = decodeConfiguration(token);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(encodeConfiguration(decoded.configuration)).toBe(token);
    }
  });

  it('produces a different token when a parameter changes', () => {
    const a = createEarthBaselineConfiguration();
    const b = createEarthBaselineConfiguration();
    b.planetary.massEarthMasses = 2;
    expect(encodeConfiguration(b)).not.toBe(encodeConfiguration(a));
  });
});

describe('decodeConfiguration failure modes', () => {
  it('rejects a malformed base64 token', () => {
    const result = decodeConfiguration('!!!not base64!!!');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain('malformed');
    }
  });

  it('rejects a token whose payload is not an object', () => {
    expect(decodeConfiguration(encodeEnvelope(42)).ok).toBe(false);
    expect(decodeConfiguration(encodeEnvelope([1, 2])).ok).toBe(false);
  });

  it('rejects a token with no schema version', () => {
    const result = decodeConfiguration(encodeEnvelope({ c: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain('schema version');
    }
  });

  it('rejects a token whose configuration is missing or malformed', () => {
    expect(decodeConfiguration(encodeEnvelope({ v: '0.1.0' })).ok).toBe(false);
    expect(decodeConfiguration(encodeEnvelope({ v: '0.1.0', c: 5 })).ok).toBe(false);
  });

  it('rejects a token whose version has no migration path', () => {
    const result = decodeConfiguration(
      encodeEnvelope({ v: '99.0.0', c: createEarthBaselineConfiguration() }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain('incompatible version');
    }
  });

  it('rejects a current-version token with a null required section', () => {
    const result = decodeConfiguration(
      encodeEnvelope({ v: PLANETARY_STATE_SCHEMA_VERSION, c: { ...createEarthBaselineConfiguration(), stellar: null } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain('missing required parameters');
    }
  });

  it('rejects a structurally complete but physically invalid configuration', () => {
    const invalid = createEarthBaselineConfiguration();
    invalid.planetary.massEarthMasses = 0; // fails validation
    const result = decodeConfiguration(
      encodeEnvelope({ v: PLANETARY_STATE_SCHEMA_VERSION, c: invalid }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.some((d) => d.parameter === 'planetary.massEarthMasses')).toBe(true);
    }
  });

  it('returns a diagnostic instead of throwing when a section is the wrong type', () => {
    // Section guard rejects a non-object section before validation can throw.
    const result = decodeConfiguration(
      encodeEnvelope({
        v: PLANETARY_STATE_SCHEMA_VERSION,
        c: { ...createEarthBaselineConfiguration(), atmosphere: 'gaseous' },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it('catches a validation throw from a structurally-object section with missing inner fields', () => {
    // atmosphere is an object (passes the section guard) but lacks
    // partialPressuresKilopascals, so validation throws on Object.entries —
    // the safety net converts it to a diagnostic rather than crashing.
    const result = decodeConfiguration(
      encodeEnvelope({
        v: PLANETARY_STATE_SCHEMA_VERSION,
        c: { ...createEarthBaselineConfiguration(), atmosphere: {} },
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain('could not be validated');
    }
  });
});

describe('migrateConfiguration chain', () => {
  it('returns the payload unchanged when already at the target version', () => {
    const result = migrateConfiguration('0.1.0', { a: 1 }, '0.1.0', {});
    expect(result).toEqual({ ok: true, raw: { a: 1 } });
  });

  it('chains multiple forward steps to reach the target', () => {
    const registry: Record<string, ConfigurationMigration> = {
      '0.1.0': { to: '0.2.0', migrate: (raw) => ({ ...raw, step1: true }) },
      '0.2.0': { to: '0.3.0', migrate: (raw) => ({ ...raw, step2: true }) },
    };
    const result = migrateConfiguration('0.1.0', { base: true }, '0.3.0', registry);
    expect(result).toEqual({ ok: true, raw: { base: true, step1: true, step2: true } });
  });

  it('reports an error when no migration path exists', () => {
    const result = migrateConfiguration('0.1.0', {}, '0.2.0', {});
    expect(result).toEqual({ ok: false, reason: expect.stringContaining('no migration path') as string });
  });

  it('detects a migration cycle rather than looping forever', () => {
    const registry: Record<string, ConfigurationMigration> = {
      '0.1.0': { to: '0.2.0', migrate: (raw) => raw },
      '0.2.0': { to: '0.1.0', migrate: (raw) => raw },
    };
    const result = migrateConfiguration('0.1.0', {}, '9.9.9', registry);
    expect(result).toEqual({ ok: false, reason: expect.stringContaining('cycle') as string });
  });
});
