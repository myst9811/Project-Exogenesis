/**
 * @module store/createStore.test
 */

import { describe, expect, it, vi } from 'vitest';

import { createStore } from './createStore';

describe('createStore', () => {
  it('returns the initial state', () => {
    const store = createStore({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('replaces state with a direct value and notifies subscribers', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState({ count: 1 });
    expect(store.getState()).toEqual({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('replaces state with an updater function of the previous state', () => {
    const store = createStore({ count: 5 });
    store.setState((previous) => ({ count: previous.count + 1 }));
    expect(store.getState()).toEqual({ count: 6 });
  });

  it('does not notify when the next state is reference-equal', () => {
    const initial = { count: 0 };
    const store = createStore(initial);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState(initial);
    store.setState((previous) => previous);
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies every subscriber', () => {
    const store = createStore(0);
    const first = vi.fn();
    const second = vi.fn();
    store.subscribe(first);
    store.subscribe(second);
    store.setState(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops notifying after unsubscribe and is idempotent', () => {
    const store = createStore(0);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    unsubscribe(); // idempotent — must not throw
    store.setState(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('tolerates a subscriber unsubscribing during notification', () => {
    const store = createStore(0);
    const calls: string[] = [];
    const unsubscribeSelf = store.subscribe(() => {
      calls.push('self');
      unsubscribeSelf();
    });
    store.subscribe(() => calls.push('other'));
    store.setState(1);
    store.setState(2);
    // 'self' fires once (first change), 'other' fires on both changes.
    expect(calls).toEqual(['self', 'other', 'other']);
  });
});
