/**
 * @module ui/HistoryControls.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { commitConfiguration, createAppStores, createDefaultConfiguration } from '../store';
import { HistoryControls } from './HistoryControls';
import { StoresProvider } from './StoresProvider';

afterEach(cleanup);

describe('HistoryControls', () => {
  it('disables undo and redo on an empty timeline', () => {
    render(
      <StoresProvider stores={createAppStores()}>
        <HistoryControls />
      </StoresProvider>,
    );
    expect(screen.getByRole<HTMLButtonElement>('button', { name: /Undo/ }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: /Redo/ }).disabled).toBe(true);
  });

  it('enables undo after a second commit and reverts on click', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    const denser = createDefaultConfiguration();
    denser.planetary.massEarthMasses = 2;
    await commitConfiguration(stores, denser);

    render(
      <StoresProvider stores={stores}>
        <HistoryControls />
      </StoresProvider>,
    );
    const undo = screen.getByRole<HTMLButtonElement>('button', { name: /Undo/ });
    expect(undo.disabled).toBe(false);

    fireEvent.click(undo);
    await waitFor(() => {
      expect(stores.simulation.getState().configuration?.planetary.massEarthMasses).toBe(1);
    });

    const redo = screen.getByRole<HTMLButtonElement>('button', { name: /Redo/ });
    expect(redo.disabled).toBe(false);
    fireEvent.click(redo);
    await waitFor(() => {
      expect(stores.simulation.getState().configuration?.planetary.massEarthMasses).toBe(2);
    });
  });
});
