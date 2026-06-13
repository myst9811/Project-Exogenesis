/**
 * @module ui/App.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { encodeConfigurationToken } from '../store';
import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import type { PlanetRenderer } from '../renderer/scene/planetRenderer';
import { App } from './App';

beforeEach(() => {
  window.history.replaceState(null, '', '#');
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '#');
});

/** A fake renderer so the app mounts without a WebGL context in jsdom. */
function fakeRenderer(): PlanetRenderer {
  return { setParameters: vi.fn(), setView: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
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
    expect(screen.getByLabelText('status').getAttribute('data-status')).toBe('ready');
  });

  it('reflects the computed world into the URL after seeding', async () => {
    render(<App createRenderer={fakeRenderer} />);
    await waitFor(() => {
      expect(window.location.hash).toContain('w=');
    });
  });

  it('loads a shared world from the URL fragment instead of the default', async () => {
    const heavy = createEarthBaselineConfiguration();
    heavy.planetary.massEarthMasses = 2; // ~2 g surface gravity
    window.history.replaceState(null, '', `#w=${encodeConfigurationToken(heavy)}`);

    render(<App createRenderer={fakeRenderer} />);
    // The shared world (not Earth) appears: 2 M⊕ at 1 R⊕ reads as very heavy.
    await waitFor(() => {
      expect(screen.getByText('Very heavy gravity')).toBeTruthy();
    });
    expect(screen.queryByText('Earth-like gravity')).toBeNull();
  });

  it('falls back to the default world and warns when the link is invalid', async () => {
    window.history.replaceState(null, '', '#w=this-is-not-a-valid-token');

    render(<App createRenderer={fakeRenderer} />);
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('default world');
    });
    expect(screen.getByText('Earth-like gravity')).toBeTruthy();
  });
});
