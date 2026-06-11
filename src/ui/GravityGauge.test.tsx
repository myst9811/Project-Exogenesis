/**
 * @module ui/GravityGauge.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { GravityGauge } from './GravityGauge';

afterEach(cleanup);

describe('GravityGauge', () => {
  it('labels the needle position with the gravity in g (Earth → ~1.00 g)', () => {
    render(<GravityGauge surfaceGravityMetersPerSecondSquared={9.80665} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('1.00 g');
  });

  it('reports a heavier world in g (2 g)', () => {
    render(<GravityGauge surfaceGravityMetersPerSecondSquared={19.6133} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('2.00 g');
  });

  it('renders the four reference bodies', () => {
    render(<GravityGauge surfaceGravityMetersPerSecondSquared={9.80665} />);
    for (const body of ['MARS', 'EARTH', 'SUPER-E', 'JUPITER']) {
      expect(screen.getByText(body)).toBeTruthy();
    }
  });
});
