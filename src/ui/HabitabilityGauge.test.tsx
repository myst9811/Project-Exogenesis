/**
 * @module ui/HabitabilityGauge.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HabitabilityGauge, survivabilityTone } from './HabitabilityGauge';

afterEach(cleanup);

describe('survivabilityTone', () => {
  it('bands the score nominal / caution / critical', () => {
    expect(survivabilityTone(85)).toBe('nominal');
    expect(survivabilityTone(70)).toBe('nominal');
    expect(survivabilityTone(55)).toBe('caution');
    expect(survivabilityTone(40)).toBe('caution');
    expect(survivabilityTone(10)).toBe('critical');
  });
});

describe('HabitabilityGauge', () => {
  it('labels the score and the limiting factor', () => {
    render(<HabitabilityGauge score={98} limitingFactor="thermal" />);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toContain('98 of 100');
    expect(label).toContain('thermal');
  });

  it('renders the limiting factor caption in the gauge', () => {
    render(<HabitabilityGauge score={30} limitingFactor="carbon-dioxide" />);
    expect(screen.getByText(/LIMIT · CARBON DIOXIDE/)).toBeTruthy();
  });

  it('clamps an out-of-range score into the label', () => {
    render(<HabitabilityGauge score={140} limitingFactor="gravity" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('100 of 100');
  });
});
