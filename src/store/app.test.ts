/**
 * @module store/app.test
 */

import { describe, expect, it } from 'vitest';

import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import {
  type AppStores,
  commitConfiguration,
  createAppStores,
  redoConfiguration,
  undoConfiguration,
} from './app';

function denserEarth(): ReturnType<typeof createEarthBaselineConfiguration> {
  const configuration = createEarthBaselineConfiguration();
  configuration.planetary.massEarthMasses = 2;
  return configuration;
}

describe('createAppStores', () => {
  it('creates idle, empty simulation/ui/history stores', () => {
    const stores: AppStores = createAppStores();
    expect(stores.simulation.getState().status).toBe('idle');
    expect(stores.history.getState().present).toBeNull();
    expect(stores.ui.getState().activePanel).toBe('stellar');
  });
});

describe('commitConfiguration', () => {
  it('records the configuration in history and computes the simulation', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createEarthBaselineConfiguration());
    expect(stores.simulation.getState().status).toBe('ready');
    expect(stores.history.getState().present).not.toBeNull();
    expect(stores.history.canUndo()).toBe(false);
  });
});

describe('undoConfiguration / redoConfiguration', () => {
  it('re-applies the previous configuration on undo and the next on redo', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createEarthBaselineConfiguration());
    const earthState = stores.simulation.getState().planetaryState;
    await commitConfiguration(stores, denserEarth());
    const denserState = stores.simulation.getState().planetaryState;
    expect(denserState).not.toBe(earthState);

    await undoConfiguration(stores);
    expect(stores.simulation.getState().planetaryState?.bulk.massKilograms).toBe(
      earthState?.bulk.massKilograms,
    );

    await redoConfiguration(stores);
    expect(stores.simulation.getState().planetaryState?.bulk.massKilograms).toBe(
      denserState?.bulk.massKilograms,
    );
  });

  it('is a no-op when there is nothing to undo or redo', async () => {
    const stores = createAppStores();
    await expect(undoConfiguration(stores)).resolves.toBeUndefined();
    await expect(redoConfiguration(stores)).resolves.toBeUndefined();
    expect(stores.simulation.getState().status).toBe('idle');
  });
});
