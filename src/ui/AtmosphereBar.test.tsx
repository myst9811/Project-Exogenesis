/**
 * @module ui/AtmosphereBar.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AtmosphereBar } from './AtmosphereBar';

afterEach(cleanup);

describe('AtmosphereBar', () => {
  it('summarizes composition by share, in gas order', () => {
    render(<AtmosphereBar partialPressuresKilopascals={{ N2: 78, O2: 21, Ar: 1 }} />);
    const label = screen.getByLabelText(/Atmosphere composition/).getAttribute('aria-label') ?? '';
    expect(label).toContain('78% N2');
    expect(label).toContain('21% O2');
  });

  it('renders a legend entry per present gas with a percentage', () => {
    render(<AtmosphereBar partialPressuresKilopascals={{ N2: 50, CO2: 50 }} />);
    expect(screen.getAllByText('50.0%')).toHaveLength(2);
  });

  it('shows an airless note when there is no atmosphere', () => {
    render(<AtmosphereBar partialPressuresKilopascals={{}} />);
    expect(screen.getByText(/airless world/i)).toBeTruthy();
  });

  it('ignores zero-pressure gases', () => {
    render(<AtmosphereBar partialPressuresKilopascals={{ N2: 100, O2: 0 }} />);
    const label = screen.getByLabelText(/Atmosphere composition/).getAttribute('aria-label') ?? '';
    expect(label).toContain('100% N2');
    expect(label).not.toContain('O2');
  });
});
