/**
 * @module ui/ViewportHud.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { commitConfiguration, createAppStores, createDefaultConfiguration } from '../store';
import { StoresProvider } from './StoresProvider';
import { ViewportHud } from './ViewportHud';

afterEach(cleanup);

describe('ViewportHud', () => {
  it('renders nothing before a world is computed', () => {
    const { container } = render(
      <StoresProvider stores={createAppStores()}>
        <ViewportHud />
      </StoresProvider>,
    );
    expect(container.querySelector('.viewport-hud')).toBeNull();
  });

  it('derives the designation from the configuration hash, not a fabricated catalog id', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    render(
      <StoresProvider stores={stores}>
        <ViewportHud />
      </StoresProvider>,
    );
    const designation = screen.getByText(/^EXO-[0-9A-F]{6}$/);
    expect(designation).toBeTruthy();
    // The real hash prefix (Earth baseline) drives it.
    const hash = stores.simulation.getState().planetaryState?.configurationHash ?? '';
    expect(designation.textContent).toBe(`EXO-${hash.slice(0, 6).toUpperCase()}`);
  });

  it('shows the real stellar class and habitable-zone position', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    render(
      <StoresProvider stores={stores}>
        <ViewportHud />
      </StoresProvider>,
    );
    expect(screen.getByText('STAR · G-TYPE')).toBeTruthy();
    expect(screen.getByText('INSIDE · CONSERVATIVE')).toBeTruthy();
  });
});
