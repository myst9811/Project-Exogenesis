/**
 * @module ui/MissionIcon.test
 * @vitest-environment jsdom
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MissionIcon } from './MissionIcon';

afterEach(cleanup);

describe('MissionIcon', () => {
  it('renders the named icon as an inline svg with the state class and label', () => {
    const { container } = render(<MissionIcon name="rover" label="Surface" state="locked" />);
    const wrapper = container.querySelector('.mission-icon');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains('mission-icon--locked')).toBe(true);
    expect(wrapper?.getAttribute('aria-label')).toBe('Surface');
    expect(wrapper?.getAttribute('role')).toBe('img');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('is decorative (aria-hidden, no role) when no label is given', () => {
    const { container } = render(<MissionIcon name="rocket" />);
    const wrapper = container.querySelector('.mission-icon');
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper?.getAttribute('role')).toBeNull();
  });
});
