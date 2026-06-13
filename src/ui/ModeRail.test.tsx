/**
 * @module ui/ModeRail.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModeRail } from './ModeRail';

afterEach(cleanup);

describe('ModeRail', () => {
  it('renders three enabled view buttons with labels', () => {
    render(<ModeRail view="observation" onSelectView={vi.fn()} />);
    expect(screen.getByRole('button', { name: /observation/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /surface/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /system/i })).not.toBeNull();
  });

  it('marks the active view with aria-current', () => {
    render(<ModeRail view="surface" onSelectView={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /surface/i }).getAttribute('aria-current'),
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: /observation/i }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('calls onSelectView with the chosen view', () => {
    const onSelectView = vi.fn();
    render(<ModeRail view="observation" onSelectView={onSelectView} />);
    fireEvent.click(screen.getByRole('button', { name: /system/i }));
    expect(onSelectView).toHaveBeenCalledWith('system');
  });
});
