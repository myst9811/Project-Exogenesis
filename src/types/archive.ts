/**
 * @module types/archive
 *
 * The Exploration Archive's cosmetic metadata layer. These types describe a
 * user's saved, named worlds. They are NEVER consumed by the physics engine
 * (CLAUDE.md §4/§7): a `WorldArchiveEntry` is keyed by the world's computed
 * `configurationHash` but carries only display data and the share token used
 * to reload the world through the existing physics path.
 */

import type { SpectralClass } from './configuration';
import type { HabitableZonePosition } from './physics';
import type { SurvivalFactorId } from './habitability';

/** Persistence-format version, independent of the physics schema version. */
export const ARCHIVE_SCHEMA_VERSION = '1.0.0';

/**
 * A snapshot of key readouts captured at save time, so archive cards render
 * without recomputing physics. Labeled "as cataloged" in the UI — values may
 * be stale if physics models later change.
 */
export interface CatalogSnapshot {
  spectralClass: SpectralClass;
  semiMajorAxisAu: number;
  surfaceTemperatureKelvin: number;
  surfaceGravityEarthG: number;
  survivabilityScore: number;
  habitableZonePosition: HabitableZonePosition | 'unknown';
  limitingFactor: SurvivalFactorId | 'unknown';
}

/** One saved, named world. Keyed by `configurationHash`. */
export interface WorldArchiveEntry {
  /** Matches `PlanetaryState.configurationHash` — the primary key. */
  configurationHash: string;
  /** User-chosen common name. Cosmetic; never sent to physics. */
  commonName: string;
  /** ADR-007 share token captured at save, used to reload the world. */
  shareToken: string;
  /** ISO-8601 UTC time the world was first designated. */
  designatedAt: string;
  /** ISO-8601 UTC time of the last rename or re-save. */
  updatedAt: string;
  /** Readout snapshot for fast card display. */
  catalogSnapshot: CatalogSnapshot;
}

/** Sort orders offered by the archive panel. */
export type ArchiveSortKey = 'recent' | 'name' | 'survivability';

/** The archive store's state. Entries keyed by `configurationHash`. */
export interface ArchiveState {
  schemaVersion: string;
  entries: Readonly<Record<string, WorldArchiveEntry>>;
  /** Most recently designated or loaded hash — UI highlight only. */
  activeHash: string | null;
  /** True once initial hydration from storage has completed. */
  hydrated: boolean;
}
