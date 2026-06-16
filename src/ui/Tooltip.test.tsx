/**
 * @module ui/Tooltip.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { ParameterTooltip } from './tooltips/types';
import { Tooltip } from './Tooltip';

afterEach(cleanup);

const FULL_TOOLTIP: ParameterTooltip = {
  title: 'Semi-Major Axis',
  definition: 'The average distance between a planet and its star.',
  analogy: 'How far from the campfire you sit.',
  anchors: [
    { label: 'Earth', value: '1.00 AU', isEarth: true },
    { label: 'Mars', value: '1.52 AU' },
  ],
};

const MINIMAL_TOOLTIP: ParameterTooltip = {
  title: 'Surface Gravity',
  definition: 'Gravitational acceleration at the surface.',
};

describe('Tooltip', () => {
  it('renders the trigger button', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    expect(screen.getByRole('button', { name: 'More information' })).toBeTruthy();
  });

  it('does not show the card at rest', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the card on mouse enter', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('hides the card on mouse leave', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    const btn = screen.getByRole('button', { name: 'More information' });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the card on focus', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.focus(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('hides the card on blur', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    const btn = screen.getByRole('button', { name: 'More information' });
    fireEvent.focus(btn);
    fireEvent.blur(btn);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes the card on Escape', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders title and definition', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText('Semi-Major Axis')).toBeTruthy();
    expect(screen.getByText('The average distance between a planet and its star.')).toBeTruthy();
  });

  it('renders the analogy when provided', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText('How far from the campfire you sit.')).toBeTruthy();
  });

  it('omits the analogy when not provided', () => {
    render(<Tooltip tooltip={MINIMAL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.queryByText(/campfire/)).toBeNull();
  });

  it('renders anchor labels and values when provided', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText(/Earth/)).toBeTruthy();
    expect(screen.getByText(/1\.00 AU/)).toBeTruthy();
    expect(screen.getByText(/Mars/)).toBeTruthy();
    expect(screen.getByText(/1\.52 AU/)).toBeTruthy();
  });

  it('marks the Earth anchor with a checkmark', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('omits anchors when not provided', () => {
    render(<Tooltip tooltip={MINIMAL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.queryByText('Known values')).toBeNull();
  });
});
