/**
 * @module ui/WorldReadouts.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { commitConfiguration, createAppStores, createDefaultConfiguration } from '../store';
import { StoresProvider } from './StoresProvider';
import { WorldReadouts } from './WorldReadouts';

afterEach(cleanup);

describe('WorldReadouts', () => {
  it('prompts to configure a world before anything is computed', () => {
    render(
      <StoresProvider stores={createAppStores()}>
        <WorldReadouts />
      </StoresProvider>,
    );
    expect(screen.getByText(/Configure a world/)).toBeTruthy();
  });

  it('renders translated, Earth-like cards for the default world', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    render(
      <StoresProvider stores={stores}>
        <WorldReadouts />
      </StoresProvider>,
    );
    // Translation layer framing for the Earth baseline.
    expect(screen.getByText('Earth-like gravity')).toBeTruthy();
    expect(screen.getByText('Temperate')).toBeTruthy();
    expect(screen.getByText('Earth-like pressure')).toBeTruthy();
    expect(screen.getByText('Earth-like year')).toBeTruthy();
  });
});
