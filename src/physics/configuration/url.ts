/**
 * @module physics/configuration/url
 *
 * Deterministic URL serialization of a `PlanetConfiguration` (ADR-007).
 * Encodes the validated *inputs* (not computed state) plus the schema
 * version into a compact, URL-safe token; decoding migrates old payloads
 * forward, validates, and returns a configuration the engine can recompute.
 *
 * Pure and DOM-free: it uses only the web-standard `btoa`/`atob`/`TextEncoder`
 * globals (available in browsers and Node), never `window` or `document`, so
 * it stays within the physics boundary (CLAUDE.md §4). The DOM glue that
 * reads and writes `window.location` lives in `ui/`.
 *
 * Decoding is a trust boundary (CLAUDE.md §19): a token can come from
 * anywhere, so every failure mode returns a typed diagnostic rather than
 * throwing into the caller.
 */

import type { PlanetConfiguration, SimulationDiagnostic } from '../../types/configuration';
import { PLANETARY_STATE_SCHEMA_VERSION } from '../../types/physics';
import { canonicalizeForHashing } from './manifest';
import { CONFIGURATION_MIGRATIONS, type ConfigurationMigration } from './migrations';
import { validatePlanetConfiguration } from './validation';

/** The sub-objects every configuration envelope must carry. */
const REQUIRED_CONFIGURATION_SECTIONS = [
  'stellar',
  'orbital',
  'planetary',
  'rotation',
  'atmosphere',
] as const;

export type DecodeConfigurationResult =
  | { ok: true; configuration: PlanetConfiguration }
  | { ok: false; diagnostics: SimulationDiagnostic[] };

function decodeDiagnostic(message: string, explanation: string): SimulationDiagnostic {
  return { severity: 'error', parameter: 'sharedWorld', message, explanation };
}

/** Encodes a UTF-8 string as unpadded base64url. */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decodes an unpadded base64url string back to UTF-8. Throws on malformed input. */
function fromBase64Url(token: string): string {
  const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Encodes a configuration into a shareable token: base64url of the canonical
 * `{ v, c }` envelope. Uses the same canonical serialization as the manifest
 * hash, so a world's token and its identity hash share one canonical form,
 * and `encode` is deterministic regardless of input key order.
 *
 * @param configuration - The configuration to share (assumed already valid)
 * @returns A URL-safe token
 */
export function encodeConfiguration(configuration: PlanetConfiguration): string {
  const envelope = { v: PLANETARY_STATE_SCHEMA_VERSION, c: configuration };
  return toBase64Url(canonicalizeForHashing(envelope));
}

/**
 * Chains forward migrations from `fromVersion` to `targetVersion`.
 *
 * @param fromVersion - The payload's schema version
 * @param raw - The raw configuration object at `fromVersion`
 * @param targetVersion - The schema version to reach
 * @param migrations - The migration registry (injectable for testing)
 * @returns The migrated raw object, or a reason the chain could not complete
 */
export function migrateConfiguration(
  fromVersion: string,
  raw: Record<string, unknown>,
  targetVersion: string,
  migrations: Readonly<Record<string, ConfigurationMigration>> = CONFIGURATION_MIGRATIONS,
): { ok: true; raw: Record<string, unknown> } | { ok: false; reason: string } {
  let version = fromVersion;
  let current = raw;
  const visited = new Set<string>();
  while (version !== targetVersion) {
    if (visited.has(version)) {
      return { ok: false, reason: `migration cycle detected at schema ${version}` };
    }
    visited.add(version);
    const step = migrations[version];
    if (step === undefined) {
      return {
        ok: false,
        reason: `no migration path from schema ${version} to ${targetVersion}`,
      };
    }
    current = step.migrate(current);
    version = step.to;
  }
  return { ok: true, raw: current };
}

/**
 * Decodes a shared-world token into a validated configuration, migrating it
 * forward to the current schema first. Never throws: every failure mode
 * (bad base64, bad JSON, missing version, unmigratable version, validation
 * failure) returns `ok: false` with diagnostics.
 *
 * @param token - The shared-world token from a URL
 * @param migrations - The migration registry (injectable for testing)
 * @returns The decoded configuration or collected diagnostics
 */
export function decodeConfiguration(
  token: string,
  migrations: Readonly<Record<string, ConfigurationMigration>> = CONFIGURATION_MIGRATIONS,
): DecodeConfigurationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(token));
  } catch {
    return {
      ok: false,
      diagnostics: [
        decodeDiagnostic(
          'The shared world link is malformed and could not be read.',
          'The link’s encoded data is not valid — it may have been truncated or altered in transit.',
        ),
      ],
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      diagnostics: [
        decodeDiagnostic(
          'The shared world link does not contain a world.',
          'The decoded data is not a world envelope.',
        ),
      ],
    };
  }
  const envelope = parsed as Record<string, unknown>;
  const version = envelope.v;
  const rawConfiguration = envelope.c;
  if (typeof version !== 'string') {
    return {
      ok: false,
      diagnostics: [
        decodeDiagnostic(
          'The shared world link is missing its schema version.',
          'Without a version the world cannot be migrated to the current schema.',
        ),
      ],
    };
  }
  if (
    typeof rawConfiguration !== 'object' ||
    rawConfiguration === null ||
    Array.isArray(rawConfiguration)
  ) {
    return {
      ok: false,
      diagnostics: [
        decodeDiagnostic(
          'The shared world link does not contain configuration data.',
          'The world envelope is present but its configuration is missing or malformed.',
        ),
      ],
    };
  }

  const migrated = migrateConfiguration(
    version,
    rawConfiguration as Record<string, unknown>,
    PLANETARY_STATE_SCHEMA_VERSION,
    migrations,
  );
  if (!migrated.ok) {
    return {
      ok: false,
      diagnostics: [
        decodeDiagnostic(
          `This shared world was created with an incompatible version (${version}).`,
          migrated.reason,
        ),
      ],
    };
  }

  const malformedSection = REQUIRED_CONFIGURATION_SECTIONS.find((section) => {
    const value = migrated.raw[section];
    return typeof value !== 'object' || value === null || Array.isArray(value);
  });
  if (malformedSection !== undefined) {
    return {
      ok: false,
      diagnostics: [
        decodeDiagnostic(
          'The shared world is missing required parameters.',
          `The configuration has no valid "${malformedSection}" section after migration.`,
        ),
      ],
    };
  }

  // Validation reads nested fields; the section guard above ensures each
  // section is a non-null object, but the trust boundary keeps a safety net
  // so any unexpected shape becomes a diagnostic rather than a thrown error.
  const candidate = migrated.raw as unknown as PlanetConfiguration;
  try {
    const validation = validatePlanetConfiguration(candidate);
    if (!validation.valid) {
      return { ok: false, diagnostics: validation.diagnostics };
    }
  } catch {
    return {
      ok: false,
      diagnostics: [
        decodeDiagnostic(
          'The shared world could not be validated.',
          'The configuration has an unexpected structure.',
        ),
      ],
    };
  }
  return { ok: true, configuration: candidate };
}
