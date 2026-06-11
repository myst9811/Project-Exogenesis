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

import type { PlanetConfiguration } from '../types/configuration';
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
