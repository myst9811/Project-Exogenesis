/**
 * @module store/createStore
 *
 * A minimal framework-agnostic pub/sub store (ADR-005). State is replaced,
 * never mutated; subscribers are notified on every committed change.
 *
 * This is deliberately tiny: the CLAUDE.md §17 dependency policy is met by
 * owning these few lines rather than importing a state library. A React
 * adapter over `subscribe`/`getState` (`useSyncExternalStore`) belongs in
 * `ui/` and arrives in Phase 6.
 */

/** A subscriber invoked after each committed state change. */
export type Listener = () => void;

/** Unsubscribe handle returned by {@link Store.subscribe}. */
export type Unsubscribe = () => void;

/**
 * A read-mostly state container. Consumers read via {@link getState} and
 * react via {@link subscribe}; only the owning module's actions call
 * {@link setState}, which keeps the write surface controlled (CLAUDE.md §4).
 */
export interface Store<T> {
  /** Returns the current immutable state snapshot. */
  getState: () => T;
  /**
   * Replaces the state and notifies subscribers. Accepts the next state or
   * an updater computing it from the previous state. A reference-equal
   * result is a no-op (no notification).
   */
  setState: (next: T | ((previous: T) => T)) => void;
  /** Registers a listener; returns an idempotent unsubscribe handle. */
  subscribe: (listener: Listener) => Unsubscribe;
}

/**
 * Creates a store seeded with `initialState`.
 *
 * @param initialState - The initial immutable state
 * @returns A {@link Store} over that state
 */
export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener>();

  const getState = (): T => state;

  const setState = (next: T | ((previous: T) => T)): void => {
    const resolved =
      typeof next === 'function' ? (next as (previous: T) => T)(state) : next;
    if (Object.is(resolved, state)) {
      return;
    }
    state = resolved;
    for (const listener of [...listeners]) {
      listener();
    }
  };

  const subscribe = (listener: Listener): Unsubscribe => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getState, setState, subscribe };
}
