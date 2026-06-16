/**
 * @module ui/ReadoutCard.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ReadoutCard } from './ReadoutCard';
import type { ParameterTooltip } from './tooltips/types';

const MOCK_TOOLTIP: ParameterTooltip = {
  title: 'Surface Gravity',
  definition: 'Gravitational acceleration at the surface.',
};

afterEach(cleanup);

describe('ReadoutCard', () => {
  it('shows the label, brief, narrative, comparison, and raw value', () => {
    render(
      <ReadoutCard
        label="Surface Temperature"
        translation={{
          brief: 'Temperate',
          narrative: 'Comfortable by Earth standards.',
          earthComparison: "Earth's average is about 15 °C.",
        }}
        rawValue="288 K | 15 °C"
      />,
    );
    expect(screen.getByRole('heading', { name: 'Surface Temperature' })).toBeTruthy();
    expect(screen.getByText('Temperate')).toBeTruthy();
    expect(screen.getByText('Comfortable by Earth standards.')).toBeTruthy();
    expect(screen.getByText("Earth's average is about 15 °C.")).toBeTruthy();
    expect(screen.getByLabelText('raw value').textContent).toBe('288 K | 15 °C');
  });

  it('omits the comparison line when no Earth comparison is provided', () => {
    render(
      <ReadoutCard
        label="Gravity"
        translation={{ brief: 'Earth-like gravity', narrative: 'Feels like Earth.' }}
        rawValue="9.8 m/s²"
      />,
    );
    expect(screen.queryByText(/Earth's/)).toBeNull();
    expect(screen.getByLabelText('raw value').textContent).toBe('9.8 m/s²');
  });

  it('renders a tooltip trigger when the tooltip prop is provided', () => {
    render(<ReadoutCard label="Gravity" rawValue="9.8 m/s²" tooltip={MOCK_TOOLTIP} />);
    expect(screen.getByRole('button', { name: 'More information' })).toBeTruthy();
  });

  it('does not render a tooltip trigger when tooltip is not provided', () => {
    render(<ReadoutCard label="Gravity" rawValue="9.8 m/s²" />);
    expect(screen.queryByRole('button', { name: 'More information' })).toBeNull();
  });

  it('existing heading name is unaffected when tooltip is present', () => {
    render(
      <ReadoutCard
        label="Surface Temperature"
        translation={{
          brief: 'Temperate',
          narrative: 'Comfortable by Earth standards.',
          earthComparison: "Earth's average is about 15 °C.",
        }}
        rawValue="288 K | 15 °C"
        tooltip={MOCK_TOOLTIP}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Surface Temperature' })).toBeTruthy();
  });
});
