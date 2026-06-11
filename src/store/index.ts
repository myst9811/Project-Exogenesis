/**
 * @module store
 *
 * Application state (ADR-005): a framework-agnostic pub/sub core under
 * three typed stores — the simulation store (physics inputs → published
 * `PlanetaryState`), the UI-only store (display preferences), and the
 * undo/redo history. The UI wires these together via store actions; a
 * React adapter over the pub/sub primitive arrives in Phase 6.
 */

export { createStore } from './createStore';
export type { Listener, Store, Unsubscribe } from './createStore';

export { createSimulationStore } from './simulation';
export type {
  ComputedWorld,
  SimulationState,
  SimulationStatus,
  SimulationStore,
  SimulationStoreOptions,
} from './simulation';

export { createUIStore } from './ui';
export type { InputPanel, TemperatureUnit, UIState, UIStore } from './ui';

export {
  createHistoryStore,
  DEFAULT_HISTORY_DEPTH,
  emptyHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from './history';
export type { HistoryState, HistoryStore } from './history';
