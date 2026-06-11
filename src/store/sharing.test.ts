/**
 * @module store/sharing.test
 *
 * Tests the store's shared-world load/encode coordination.
 */

import { describe, expect, it } from 'vitest';

import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import {
  createAppStores,
  encodeConfigurationToken,
  loadConfigurationToken,
} from './app';

describe('loadConfigurationToken', () => {
  it('decodes and commits a valid token, recording history', async () => {
    const config = createEarthBaselineConfiguration();
    config.planetary.massEarthMasses = 2;
    const token = encodeConfigurationToken(config);

    const stores = createAppStores();
    const diagnostics = await loadConfigurationToken(stores, token);

    expect(diagnostics).toEqual([]);
    expect(stores.simulation.getState().status).toBe('ready');
    expect(stores.simulation.getState().configuration?.planetary.massEarthMasses).toBe(2);
    expect(stores.history.getState().present?.planetary.massEarthMasses).toBe(2);
  });

  it('returns diagnostics and commits nothing for an invalid token', async () => {
    const stores = createAppStores();
    const diagnostics = await loadConfigurationToken(stores, 'not-a-real-token!!');
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(stores.simulation.getState().status).toBe('idle');
    expect(stores.simulation.getState().planetaryState).toBeNull();
  });

  it('round-trips a committed world through encode then load', async () => {
    const original = createEarthBaselineConfiguration();
    const token = encodeConfigurationToken(original);
    const stores = createAppStores();
    await loadConfigurationToken(stores, token);
    expect(stores.simulation.getState().configuration).toEqual(original);
  });
});
