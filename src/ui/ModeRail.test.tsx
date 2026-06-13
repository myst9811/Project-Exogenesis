/**
 * @module ui/ModeRail.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ModeRail } from './ModeRail';

afterEach(cleanup);

describe('ModeRail', () => {
  it('marks Observation active and the other modes locked', () => {
    render(<ModeRail />);
    const observation = screen.getByTitle('Observation (active)');
    expect(observation.getAttribute('aria-current')).toBe('true');
    expect(observation.getAttribute('aria-disabled')).toBeNull();
    expect(screen.getByTitle('Surface — coming soon').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByTitle('System — coming soon').getAttribute('aria-disabled')).toBe('true');
  });

  it('renders all three labelled mode icons', () => {
    render(<ModeRail />);
    expect(screen.getByLabelText('Observation')).not.toBeNull();
    expect(screen.getByLabelText('Surface')).not.toBeNull();
    expect(screen.getByLabelText('System')).not.toBeNull();
  });
});
