/**
 * @module ui/App.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlanetRenderer } from '../renderer/scene/planetRenderer';
import { App } from './App';

afterEach(cleanup);

/** A fake renderer so the app mounts without a WebGL context in jsdom. */
function fakeRenderer(): PlanetRenderer {
  return { setParameters: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
}

describe('App', () => {
  it('renders the title and seeds the default world end-to-end', async () => {
    render(<App createRenderer={fakeRenderer} />);
    expect(screen.getByRole('heading', { name: 'Project Exogenesis' })).toBeTruthy();

    // The seeded Earth baseline flows through validation, physics, and the
    // translation layer into the readouts.
    await waitFor(() => {
      expect(screen.getByText('Earth-like gravity')).toBeTruthy();
    });
    expect(screen.getByText('Temperate')).toBeTruthy();
    expect(screen.getByLabelText('world parameters')).toBeTruthy();
    expect(screen.getByLabelText('status').textContent).toBe('ready');
  });
});
