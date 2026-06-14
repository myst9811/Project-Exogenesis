/**
 * @module store/app
 *
 * Composition of the application's stores and the coordinated actions that
 * span them. Framework-agnostic (no React): the UI layer wires these into
 * a context and calls the actions, but the orchestration itself is plain
 * TypeScript and unit-testable.
 *
 * History records the *timeline of submitted configurations* (inputs).
 * Committing pushes the configuration onto the history and applies it to
 * the simulation; undo/redo move the history pointer and re-apply the
 * configuration there. Because state derives deterministically from inputs
 * (ADR-004), replaying a configuration reproduces its world exactly.
 */

import type { PlanetConfiguration, SimulationDiagnostic } from '../types/configuration';
import type { CatalogSnapshot } from '../types/archive';
import { decodeConfiguration, encodeConfiguration } from '../physics/configuration/url';
import { createArchiveStore, type ArchiveStore } from './archive';
import { loadArchive, saveArchive, type KeyValueStore } from './archivePersistence';
import { createHistoryStore, type HistoryStore } from './history';
import { createSimulationStore, type SimulationStore } from './simulation';
import { createUIStore, type UIStore } from './ui';

/** Standard gravity (m/s²) for converting surface gravity to Earth-g. NIST CODATA. */
const EARTH_SURFACE_GRAVITY = 9.806_65;

/** The bundle of stores backing one running application. */
export interface AppStores {
  simulation: SimulationStore;
  ui: UIStore;
  history: HistoryStore<PlanetConfiguration>;
  archive: ArchiveStore;
}

/**
 * Resolves a key/value store for archive persistence: the browser's
 * `localStorage` when available, else an in-memory fallback (jsdom/node).
 */
function browserStorage(): KeyValueStore {
  try {
    if (
      typeof localStorage !== 'undefined' &&
      typeof localStorage.getItem === 'function' &&
      typeof localStorage.setItem === 'function'
    ) {
      return localStorage;
    }
  } catch {
    // Access can throw in sandboxed contexts; fall through to memory.
  }
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

/**
 * Creates a fresh set of application stores. The archive is hydrated from
 * browser storage and writes through on every change.
 *
 * @param storage - Key/value store for archive persistence (defaults to localStorage)
 * @returns The application stores
 */
export function createAppStores(storage: KeyValueStore = browserStorage()): AppStores {
  const archive = createArchiveStore(loadArchive(storage), (state) => {
    saveArchive(storage, state);
  });
  return {
    simulation: createSimulationStore(),
    ui: createUIStore(),
    history: createHistoryStore<PlanetConfiguration>(),
    archive,
  };
}

/**
 * Records a configuration on the history and applies it to the simulation.
 * Resolves once the (async) recompute settles.
 */
export function commitConfiguration(
  stores: AppStores,
  configuration: PlanetConfiguration,
): Promise<void> {
  stores.history.push(configuration);
  return stores.simulation.applyConfiguration(configuration);
}

/**
 * Steps the history back and re-applies the now-current configuration.
 * A no-op (resolves immediately) when there is nothing to undo.
 */
export function undoConfiguration(stores: AppStores): Promise<void> {
  const configuration = stores.history.undo();
  if (configuration === null) {
    return Promise.resolve();
  }
  return stores.simulation.applyConfiguration(configuration);
}

/**
 * Steps the history forward and re-applies the now-current configuration.
 * A no-op (resolves immediately) when there is nothing to redo.
 */
export function redoConfiguration(stores: AppStores): Promise<void> {
  const configuration = stores.history.redo();
  if (configuration === null) {
    return Promise.resolve();
  }
  return stores.simulation.applyConfiguration(configuration);
}

/**
 * Decodes a shared-world token and, if valid, commits it (recording history
 * and recomputing). Returns the decode diagnostics: empty on success, or the
 * reasons the token could not be loaded (ADR-007). The caller decides how to
 * surface a failure and what to fall back to.
 *
 * @param stores - The application stores
 * @param token - The shared-world token from a URL
 * @returns Decode diagnostics ([] on success)
 */
export async function loadConfigurationToken(
  stores: AppStores,
  token: string,
): Promise<readonly SimulationDiagnostic[]> {
  const result = decodeConfiguration(token);
  if (!result.ok) {
    return result.diagnostics;
  }
  await commitConfiguration(stores, result.configuration);
  return [];
}

/**
 * Encodes a configuration into its shareable URL token. Re-exported through
 * the store so the UI obtains it via its sanctioned gateway rather than
 * importing physics directly (CLAUDE.md §4).
 *
 * @param configuration - The configuration to encode
 * @returns A URL-safe token
 */
export function encodeConfigurationToken(configuration: PlanetConfiguration): string {
  return encodeConfiguration(configuration);
}

/**
 * Designates (saves) the currently computed world to the archive under a
 * user-chosen common name. Reads the live `PlanetaryState` and habitability
 * to build a catalog snapshot and re-encodes the configuration to a share
 * token. Returns diagnostics: empty on success, or the reason it could not
 * be saved (no computed world, or an invalid name).
 *
 * @param stores - The application stores
 * @param commonName - The user-chosen common name
 * @returns Save diagnostics ([] on success)
 */
export function designateCurrentWorld(
  stores: AppStores,
  commonName: string,
): readonly SimulationDiagnostic[] {
  const sim = stores.simulation.getState();
  const world = sim.planetaryState;
  const configuration = sim.configuration;
  const survival = sim.habitability?.survival[0] ?? null;
  if (world === null || configuration === null || survival === null) {
    return [
      {
        severity: 'error',
        parameter: 'archive.world',
        message: 'Compute a world before designating it.',
        explanation: 'Only a successfully computed world can be saved to the archive.',
      },
    ];
  }
  const catalogSnapshot: CatalogSnapshot = {
    spectralClass: configuration.stellar.spectralClass,
    semiMajorAxisAu: configuration.orbital.semiMajorAxisAstronomicalUnits,
    surfaceTemperatureKelvin: world.climate.surfaceTemperatureKelvin,
    surfaceGravityEarthG: world.bulk.surfaceGravityMetersPerSecondSquared / EARTH_SURFACE_GRAVITY,
    survivabilityScore: survival.survivabilityScore,
    habitableZonePosition: world.habitableZone?.position ?? 'unknown',
    limitingFactor: survival.limitingFactor,
  };
  return stores.archive.designate({
    configurationHash: world.configurationHash,
    commonName,
    shareToken: encodeConfiguration(configuration),
    catalogSnapshot,
  });
}
