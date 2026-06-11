/**
 * @module store/history.test
 */

import { describe, expect, it } from 'vitest';

import {
  createHistoryStore,
  emptyHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from './history';

describe('pure history reducers', () => {
  it('emptyHistory has no present and empty stacks', () => {
    expect(emptyHistory<number>()).toEqual({ past: [], present: null, future: [] });
  });

  it('pushHistory sets the first present without growing past', () => {
    expect(pushHistory(emptyHistory<string>(), 'a')).toEqual({
      past: [],
      present: 'a',
      future: [],
    });
  });

  it('pushHistory moves the old present to past and clears future', () => {
    const history = { past: ['a'], present: 'b', future: ['c'] };
    expect(pushHistory(history, 'd')).toEqual({ past: ['a', 'b'], present: 'd', future: [] });
  });

  it('pushHistory trims the past to the configured depth', () => {
    const result = pushHistory({ past: ['a', 'b'], present: 'c', future: [] }, 'd', 2);
    expect(result.past).toEqual(['b', 'c']); // oldest ('a') dropped
    expect(result.present).toBe('d');
  });

  it('undoHistory steps the present back and pushes it onto future', () => {
    const history = { past: ['a', 'b'], present: 'c', future: ['d'] };
    expect(undoHistory(history)).toEqual({ past: ['a'], present: 'b', future: ['c', 'd'] });
  });

  it('undoHistory is a no-op (same reference) when past is empty', () => {
    const history = { past: [], present: 'a', future: [] };
    expect(undoHistory(history)).toBe(history);
  });

  it('undoHistory is a no-op when there is no present', () => {
    const history = emptyHistory<string>();
    expect(undoHistory(history)).toBe(history);
  });

  it('redoHistory steps the present forward and pushes it onto past', () => {
    const history = { past: ['a'], present: 'b', future: ['c', 'd'] };
    expect(redoHistory(history)).toEqual({ past: ['a', 'b'], present: 'c', future: ['d'] });
  });

  it('redoHistory is a no-op (same reference) when future is empty', () => {
    const history = { past: ['a'], present: 'b', future: [] };
    expect(redoHistory(history)).toBe(history);
  });

  it('redoHistory is a no-op when there is no present', () => {
    const history = emptyHistory<string>();
    expect(redoHistory(history)).toBe(history);
  });
});

describe('createHistoryStore', () => {
  it('reports no undo or redo on an empty timeline', () => {
    const store = createHistoryStore<string>();
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
    expect(store.getState().present).toBeNull();
  });

  it('round-trips through push, undo, and redo', () => {
    const store = createHistoryStore<string>();
    store.push('a');
    store.push('b');
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);

    expect(store.undo()).toBe('a');
    expect(store.canRedo()).toBe(true);

    expect(store.redo()).toBe('b');
    expect(store.getState().present).toBe('b');
  });

  it('returns the present unchanged when undo or redo is not possible', () => {
    const store = createHistoryStore<string>();
    store.push('a');
    expect(store.undo()).toBe('a'); // no past beyond the first entry
    expect(store.redo()).toBe('a'); // nothing to redo
  });

  it('clears the redo future when a new entry is pushed after an undo', () => {
    const store = createHistoryStore<string>();
    store.push('a');
    store.push('b');
    store.undo(); // present 'a', future ['b']
    store.push('c'); // should discard 'b'
    expect(store.getState().future).toEqual([]);
    expect(store.canRedo()).toBe(false);
    expect(store.getState().present).toBe('c');
  });

  it('honors the configured maximum depth', () => {
    const store = createHistoryStore<number>(2);
    store.push(1);
    store.push(2);
    store.push(3);
    store.push(4);
    expect(store.getState().past).toEqual([2, 3]);
  });
});
