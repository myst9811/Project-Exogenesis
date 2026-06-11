/**
 * @module physics/configuration/migrations
 *
 * The configuration migration registry (ADR-007). Shared-world URLs embed
 * the schema version they were created under; when the schema changes, a
 * migration step upgrades old payloads to the current shape before
 * validation. The registry is keyed by *source* version and chained, so a
 * payload several versions old is migrated one step at a time.
 *
 * It is empty at schema 0.1.0 — there is nothing older to migrate yet. The
 * first breaking schema change adds an entry here; the chain runner that
 * consumes this registry (see ./url) already ships and is tested.
 */

/** One forward migration step from a source schema version. */
export interface ConfigurationMigration {
  /** The schema version this step upgrades the payload *to*. */
  to: string;
  /**
   * Transforms a raw configuration object from the source shape into the
   * `to` shape. Operates on plain decoded JSON (not a typed
   * `PlanetConfiguration`), since the source shape predates the current type.
   */
  migrate: (raw: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Forward migrations keyed by the schema version they upgrade *from*.
 * Empty at 0.1.0 (the current schema). Add an entry when a breaking schema
 * change lands, alongside a test exercising the new step.
 */
export const CONFIGURATION_MIGRATIONS: Readonly<Record<string, ConfigurationMigration>> =
  Object.freeze({});
