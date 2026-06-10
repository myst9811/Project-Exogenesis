/**
 * @module physics/configuration/manifest
 *
 * Creation of the `ConfigurationManifest` — the validated, hashed genesis
 * record of a simulation run (ARCHITECTURE.md §3.1). The hash is a SHA-256
 * digest over the schema version and a canonicalized (key-order-independent)
 * serialization of the configuration, so identical worlds hash identically
 * regardless of how their configuration object was assembled.
 *
 * Returns a typed outcome instead of throwing (TECHNICAL_DECISIONS.md
 * TD-005): the gateway reports collected diagnostics; exceptions are
 * reserved for per-function physics boundaries.
 */

import type {
  ConfigurationManifest,
  PlanetConfiguration,
  SimulationDiagnostic,
} from '../../types/configuration';
import { PLANETARY_STATE_SCHEMA_VERSION } from '../../types/physics';
import { validatePlanetConfiguration } from './validation';

export type BuildConfigurationManifestResult =
  | { ok: true; manifest: ConfigurationManifest }
  | { ok: false; diagnostics: SimulationDiagnostic[] };

/**
 * Serializes JSON-compatible data deterministically: object keys are sorted,
 * `undefined`-valued properties are dropped (matching `JSON.stringify`), and
 * output contains no insignificant whitespace. Domain: JSON-compatible
 * values only (no functions, symbols, or bigints).
 */
export function canonicalizeForHashing(value: unknown): string {
  if (value === undefined) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeForHashing).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : 1));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalizeForHashing(entryValue)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Computes the lowercase hex SHA-256 digest of a UTF-8 string. */
async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validates a configuration and, if it passes, produces its manifest.
 * The hash binds the configuration content to the schema version: the same
 * physical world always receives the same identity, and a schema bump
 * yields a new one (migration handled at the URL layer, Phase 8).
 */
export async function buildConfigurationManifest(
  configuration: PlanetConfiguration,
): Promise<BuildConfigurationManifestResult> {
  const validation = validatePlanetConfiguration(configuration);
  if (!validation.valid) {
    return { ok: false, diagnostics: validation.diagnostics };
  }
  const canonical = `${PLANETARY_STATE_SCHEMA_VERSION}\n${canonicalizeForHashing(configuration)}`;
  return {
    ok: true,
    manifest: {
      schemaVersion: PLANETARY_STATE_SCHEMA_VERSION,
      configuration,
      hash: await sha256Hex(canonical),
    },
  };
}
