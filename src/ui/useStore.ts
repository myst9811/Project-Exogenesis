/**
 * @module ui/useStore
 *
 * The React adapter over the framework-agnostic store primitive (ADR-005):
 * `useSyncExternalStore` subscribes a component to a {@link Store} and
 * re-renders it on every committed change. The store replaces state
 * immutably, so the snapshot reference is stable between changes and React
 * does not loop.
 */

import { useSyncExternalStore } from 'react';

import type { Store } from '../store';

/**
 * Subscribes the calling component to a store and returns its current state.
 *
 * @param store - The store to read reactively
 * @returns The current immutable state snapshot
 */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getState);
}
