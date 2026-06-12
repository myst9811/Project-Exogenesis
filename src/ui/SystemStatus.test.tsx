/**
 * @module ui/SystemStatus.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { commitConfiguration, createAppStores, createDefaultConfiguration } from '../store';
import { StoresProvider } from './StoresProvider';
import { SystemStatus } from './SystemStatus';

afterEach(cleanup);

describe('SystemStatus', () => {
  it('exposes the raw simulation status and a tactical label when ready', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    render(
      <StoresProvider stores={stores}>
        <SystemStatus />
      </StoresProvider>,
    );
    const status = screen.getByLabelText('status');
    expect(status.getAttribute('data-status')).toBe('ready');
    expect(status.textContent).toBe('ALL SYSTEMS NOMINAL');
  });

  it('shows standby before any world is computed', () => {
    render(
      <StoresProvider stores={createAppStores()}>
        <SystemStatus />
      </StoresProvider>,
    );
    const status = screen.getByLabelText('status');
    expect(status.getAttribute('data-status')).toBe('idle');
    expect(status.textContent).toBe('STANDBY');
  });
});
