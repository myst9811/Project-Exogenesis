/**
 * @module ui/App.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('renders the title and seeds the default world end-to-end', async () => {
    render(<App />);
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
