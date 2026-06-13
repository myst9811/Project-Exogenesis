/**
 * @module ui/NarrationPanel.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NarrationClient } from '../ai';
import {
  type AppStores,
  commitConfiguration,
  createAppStores,
  createDefaultConfiguration,
} from '../store';
import { NarrationPanel } from './NarrationPanel';
import { StoresProvider } from './StoresProvider';

afterEach(cleanup);

async function seededStores(): Promise<AppStores> {
  const stores = createAppStores();
  await commitConfiguration(stores, createDefaultConfiguration());
  return stores;
}

describe('NarrationPanel', () => {
  it('shows a disabled note when no client is configured', () => {
    render(
      <StoresProvider stores={createAppStores()}>
        <NarrationPanel client={null} />
      </StoresProvider>,
    );
    expect(screen.getByText(/narration is disabled/i)).toBeTruthy();
  });

  it('shows the no-data hint before any narration is generated', async () => {
    const client: NarrationClient = { generate: () => Promise.resolve('') };
    render(
      <StoresProvider stores={await seededStores()}>
        <NarrationPanel client={client} />
      </StoresProvider>,
    );
    expect(screen.getByText('No field notes yet — request a narration above.')).not.toBeNull();
  });

  it('generates and renders a description, sending the computed world to the client', async () => {
    const generate = vi.fn<NarrationClient['generate']>(() =>
      Promise.resolve('A temperate blue world.'),
    );
    const client: NarrationClient = { generate };
    render(
      <StoresProvider stores={await seededStores()}>
        <NarrationPanel client={client} />
      </StoresProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Describe this world' }));
    await waitFor(() => {
      expect(screen.getByText('A temperate blue world.')).toBeTruthy();
    });
    // The client received the system instruction and the computed context.
    const request = generate.mock.calls[0]?.[0];
    expect(request?.systemInstruction).toContain('Do NOT generate');
    expect(request?.userPrompt).toContain('surfaceTemperatureKelvin');
  });

  it('labels speculation distinctly with its basis', async () => {
    const client: NarrationClient = {
      generate: () => Promise.resolve('life might arise in sheltered pools'),
    };
    render(
      <StoresProvider stores={await seededStores()}>
        <NarrationPanel client={client} />
      </StoresProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Speculate' }));
    await waitFor(() => {
      expect(screen.getByText(/Scientists speculate that/i)).toBeTruthy();
    });
    expect(screen.getByText(/not computed by the physics engine/i)).toBeTruthy();
  });

  it('surfaces a generation error without crashing', async () => {
    const client: NarrationClient = {
      generate: () => Promise.reject(new Error('rate limit exceeded')),
    };
    render(
      <StoresProvider stores={await seededStores()}>
        <NarrationPanel client={client} />
      </StoresProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Describe this world' }));
    await waitFor(() => {
      expect(screen.getByText('rate limit exceeded')).toBeTruthy();
    });
  });
});
