/**
 * @module store/history
 *
 * An undo/redo history stack. Entries are configuration snapshots
 * (simulation *inputs*), not computed states: by determinism (ADR-004) an
 * input snapshot reproduces its world exactly, so the history stays small
 * and the simulation store recomputes on undo/redo.
 *
 * The reducer functions are pure and generic; `createHistoryStore` wraps
 * them over the pub/sub primitive. The past stack is bounded so a long
 * editing session cannot grow memory without limit.
 */

import { createStore, type Store } from './createStore';

/** Default maximum number of undo steps retained. */
export const DEFAULT_HISTORY_DEPTH = 100;

/** A past/present/future timeline of entries of type `T`. */
export interface HistoryState<T> {
  past: readonly T[];
  present: T | null;
  future: readonly T[];
}

/** The empty timeline. */
export function emptyHistory<T>(): HistoryState<T> {
  return { past: [], present: null, future: [] };
}

/**
 * Commits a new present entry: the old present (if any) moves onto the
 * past stack, the future is cleared, and the past is trimmed to `maxDepth`.
 */
export function pushHistory<T>(
  history: HistoryState<T>,
  entry: T,
  maxDepth: number = DEFAULT_HISTORY_DEPTH,
): HistoryState<T> {
  if (history.present === null) {
    return { past: [], present: entry, future: [] };
  }
  const grown = [...history.past, history.present];
  const past = grown.length > maxDepth ? grown.slice(grown.length - maxDepth) : grown;
  return { past, present: entry, future: [] };
}

/** Moves one step back. A no-op (returns the same reference) when empty. */
export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0 || history.present === null) {
    return history;
  }
  const previous = history.past[history.past.length - 1] as T;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

/** Moves one step forward. A no-op (returns the same reference) when empty. */
export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0 || history.present === null) {
    return history;
  }
  const [next, ...rest] = history.future as [T, ...T[]];
  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
  };
}

/** The history store: a pub/sub store plus timeline actions. */
export interface HistoryStore<T> extends Store<HistoryState<T>> {
  /** Commits a new present entry, clearing any redo future. */
  push: (entry: T) => void;
  /** Steps back; returns the new present (null only on an empty timeline). */
  undo: () => T | null;
  /** Steps forward; returns the new present (null only on an empty timeline). */
  redo: () => T | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/**
 * Creates an undo/redo history store.
 *
 * @param maxDepth - Maximum retained undo steps (defaults to {@link DEFAULT_HISTORY_DEPTH})
 * @returns A {@link HistoryStore}
 */
export function createHistoryStore<T>(maxDepth: number = DEFAULT_HISTORY_DEPTH): HistoryStore<T> {
  const store = createStore<HistoryState<T>>(emptyHistory<T>());

  return {
    ...store,
    push: (entry: T): void => {
      store.setState((history) => pushHistory(history, entry, maxDepth));
    },
    undo: (): T | null => {
      store.setState((history) => undoHistory(history));
      return store.getState().present;
    },
    redo: (): T | null => {
      store.setState((history) => redoHistory(history));
      return store.getState().present;
    },
    canUndo: (): boolean => store.getState().past.length > 0,
    canRedo: (): boolean => store.getState().future.length > 0,
  };
}
