/**
 * @module physics/configuration/manifest.test
 */

import { describe, expect, it } from 'vitest';

import type { PlanetConfiguration } from '../../types/configuration';
import { PLANETARY_STATE_SCHEMA_VERSION } from '../../types/physics';
import { createEarthBaselineConfiguration } from './earthBaseline';
import { buildConfigurationManifest, canonicalizeForHashing } from './manifest';

describe('canonicalizeForHashing', () => {
  it('sorts object keys so insertion order does not affect output', () => {
    expect(canonicalizeForHashing({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalizeForHashing({ a: 2, b: 1 })).toBe('{"a":2,"b":1}');
  });

  it('serializes nested structures, arrays, and primitives', () => {
    expect(canonicalizeForHashing({ outer: { z: [1, 'two', true, null] } })).toBe(
      '{"outer":{"z":[1,"two",true,null]}}',
    );
  });

  it('drops undefined-valued properties, matching JSON.stringify', () => {
    expect(canonicalizeForHashing({ a: 1, gone: undefined })).toBe('{"a":1}');
  });

  it('serializes a bare undefined as null', () => {
    expect(canonicalizeForHashing(undefined)).toBe('null');
  });
});

describe('buildConfigurationManifest', () => {
  it('produces a manifest with the current schema version for a valid configuration', async () => {
    const result = await buildConfigurationManifest(createEarthBaselineConfiguration());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.schemaVersion).toBe(PLANETARY_STATE_SCHEMA_VERSION);
      expect(result.manifest.hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('returns the exact known hash for the Earth baseline (cross-platform regression)', async () => {
    // Recorded under schema version 0.1.0. If this test fails, either the
    // schema version, the Earth baseline, or the canonicalization changed —
    // all three invalidate previously shared world identities (Phase 8).
    const result = await buildConfigurationManifest(createEarthBaselineConfiguration());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.hash).toBe(
        'cc2b607f8885241730eec33a86bfb7bed4539deb1f46545d9a79fcf6ba445ff4',
      );
    }
  });

  it('produces identical hashes regardless of configuration key order', async () => {
    const baseline = createEarthBaselineConfiguration();
    const reordered: PlanetConfiguration = {
      atmosphere: { partialPressuresKilopascals: { CO2: 0.04, Ar: 0.95, O2: 21.22, N2: 79.12 } },
      rotation: { axialTiltDegrees: 23.44, rotationPeriodHours: 23.9345 },
      planetary: { compositionClass: 'rocky-silicate', radiusEarthRadii: 1.0, massEarthMasses: 1.0 },
      orbital: { eccentricity: 0.0167, semiMajorAxisAstronomicalUnits: 1.0 },
      stellar: { ageGigayears: 4.567, massSolarMasses: 1.0, spectralClass: 'G' },
    };
    const [first, second] = await Promise.all([
      buildConfigurationManifest(baseline),
      buildConfigurationManifest(reordered),
    ]);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.manifest.hash).toBe(first.manifest.hash);
    }
  });

  it('produces a different hash when any parameter changes', async () => {
    const modified = createEarthBaselineConfiguration();
    modified.planetary.radiusEarthRadii = 1.1;
    const [baseline, changed] = await Promise.all([
      buildConfigurationManifest(createEarthBaselineConfiguration()),
      buildConfigurationManifest(modified),
    ]);
    expect(baseline.ok && changed.ok).toBe(true);
    if (baseline.ok && changed.ok) {
      expect(changed.manifest.hash).not.toBe(baseline.manifest.hash);
    }
  });

  it('returns the collected diagnostics instead of a manifest for an invalid configuration', async () => {
    const invalid = createEarthBaselineConfiguration();
    invalid.planetary.massEarthMasses = 0;
    const result = await buildConfigurationManifest(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics[0]?.parameter).toBe('planetary.massEarthMasses');
    }
  });
});
