/**
 * @module store/ui.test
 */

import { describe, expect, it, vi } from 'vitest';

import { createUIStore } from './ui';

describe('createUIStore', () => {
  it('starts with sensible display defaults', () => {
    const store = createUIStore();
    expect(store.getState()).toEqual({
      temperatureUnit: 'celsius',
      activePanel: 'stellar',
      showSpeculative: false,
    });
  });

  it('sets the temperature unit', () => {
    const store = createUIStore();
    store.setTemperatureUnit('kelvin');
    expect(store.getState().temperatureUnit).toBe('kelvin');
  });

  it('sets the active panel', () => {
    const store = createUIStore();
    store.setActivePanel('atmosphere');
    expect(store.getState().activePanel).toBe('atmosphere');
  });

  it('sets speculative visibility explicitly', () => {
    const store = createUIStore();
    store.setShowSpeculative(true);
    expect(store.getState().showSpeculative).toBe(true);
  });

  it('toggles speculative visibility', () => {
    const store = createUIStore();
    store.toggleSpeculative();
    expect(store.getState().showSpeculative).toBe(true);
    store.toggleSpeculative();
    expect(store.getState().showSpeculative).toBe(false);
  });

  it('notifies subscribers on a change', () => {
    const store = createUIStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setActivePanel('orbital');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
