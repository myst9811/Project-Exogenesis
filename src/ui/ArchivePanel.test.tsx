/**
 * @module ui/ArchivePanel.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  commitConfiguration,
  createAppStores,
  createDefaultConfiguration,
  designateCurrentWorld,
} from '../store';
import { ArchivePanel } from './ArchivePanel';
import { StoresProvider } from './StoresProvider';

afterEach(cleanup);

describe('ArchivePanel', () => {
  it('lists designated worlds and loads one', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    designateCurrentWorld(stores, 'Aurelia');
    const onLoad = vi.fn();
    render(
      <StoresProvider stores={stores}>
        <ArchivePanel onClose={vi.fn()} onLoad={onLoad} />
      </StoresProvider>,
    );
    expect(screen.getByText('Aurelia')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /load/i }));
    expect(onLoad).toHaveBeenCalled();
  });

  it('shows an empty-state message when nothing is saved', () => {
    render(
      <StoresProvider stores={createAppStores()}>
        <ArchivePanel onClose={vi.fn()} onLoad={vi.fn()} />
      </StoresProvider>,
    );
    expect(screen.getByText(/no worlds archived yet/i)).not.toBeNull();
  });

  it('filters by name', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    designateCurrentWorld(stores, 'Aurelia');
    render(
      <StoresProvider stores={stores}>
        <ArchivePanel onClose={vi.fn()} onLoad={vi.fn()} />
      </StoresProvider>,
    );
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'zzz' } });
    expect(screen.queryByText('Aurelia')).toBeNull();
  });
});
