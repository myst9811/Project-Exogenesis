/**
 * @module ui/InputPanels.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  type AppStores,
  commitConfiguration,
  createAppStores,
  createDefaultConfiguration,
} from '../store';
import { InputPanels } from './InputPanels';
import { StoresProvider } from './StoresProvider';

afterEach(cleanup);

async function seededStores(): Promise<AppStores> {
  const stores = createAppStores();
  await commitConfiguration(stores, createDefaultConfiguration());
  return stores;
}

describe('InputPanels', () => {
  it('renders nothing until a configuration exists', () => {
    const { container } = render(
      <StoresProvider stores={createAppStores()}>
        <InputPanels />
      </StoresProvider>,
    );
    expect(container.querySelector('form')).toBeNull();
  });

  it('dispatches a recompute and a history entry when a field is committed', async () => {
    const stores = await seededStores();
    expect(stores.history.canUndo()).toBe(false);

    render(
      <StoresProvider stores={stores}>
        <InputPanels />
      </StoresProvider>,
    );

    // Edit planetary mass (M⊕) and commit on blur. The input's accessible
    // name comes from its wrapping <label>.
    const massInput = screen.getByRole('spinbutton', { name: 'Mass (M⊕)' });
    fireEvent.change(massInput, { target: { value: '2' } });
    fireEvent.blur(massInput);

    await waitFor(() => {
      expect(stores.simulation.getState().configuration?.planetary.massEarthMasses).toBe(2);
    });
    expect(stores.simulation.getState().status).toBe('ready');
    expect(stores.history.canUndo()).toBe(true);
  });

  it('changes the spectral class through the select', async () => {
    const stores = await seededStores();
    render(
      <StoresProvider stores={stores}>
        <InputPanels />
      </StoresProvider>,
    );
    const select = screen.getByDisplayValue('G');
    fireEvent.change(select, { target: { value: 'M' } });
    await waitFor(() => {
      expect(stores.simulation.getState().configuration?.stellar.spectralClass).toBe('M');
    });
  });
});
