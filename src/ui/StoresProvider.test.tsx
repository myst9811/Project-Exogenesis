/**
 * @module ui/StoresProvider.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAppStores } from '../store';
import { StoresProvider, useStores } from './StoresProvider';

afterEach(cleanup);

function ActivePanelProbe(): JSX.Element {
  const stores = useStores();
  return <output>{stores.ui.getState().activePanel}</output>;
}

describe('StoresProvider / useStores', () => {
  it('provides the stores to descendants', () => {
    render(
      <StoresProvider stores={createAppStores()}>
        <ActivePanelProbe />
      </StoresProvider>,
    );
    expect(screen.getByRole('status').textContent).toBe('stellar');
  });

  it('throws when useStores is called outside a provider', () => {
    // Silence React's error-boundary console noise for the expected throw.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<ActivePanelProbe />)).toThrow('within a StoresProvider');
    consoleError.mockRestore();
  });
});
