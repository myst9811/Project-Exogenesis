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
import { decodeConfiguration, encodeConfiguration } from '../physics/configuration/url';
import { createHistoryStore, type HistoryStore } from './history';
import { createSimulationStore, type SimulationStore } from './simulation';
import { createUIStore, type UIStore } from './ui';

/** The bundle of stores backing one running application. */
export interface AppStores {
  simulation: SimulationStore;
  ui: UIStore;
  history: HistoryStore<PlanetConfiguration>;
}

/** Creates a fresh, unseeded set of application stores. */
export function createAppStores(): AppStores {
  return {
    simulation: createSimulationStore(),
    ui: createUIStore(),
    history: createHistoryStore<PlanetConfiguration>(),
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
