/**
 * @module ui/ViewLabel.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ViewLabel } from './ViewLabel';

afterEach(cleanup);

describe('ViewLabel', () => {
  it('shows the active view name', () => {
    render(<ViewLabel view="surface" semiMajorAxisAu={0.95} />);
    expect(screen.getByText('SURFACE')).not.toBeNull();
  });

  it('shows the schematic AU note only in the System view', () => {
    const { rerender } = render(<ViewLabel view="observation" semiMajorAxisAu={0.95} />);
    expect(screen.queryByText(/NOT TO SCALE/)).toBeNull();
    rerender(<ViewLabel view="system" semiMajorAxisAu={0.95} />);
    expect(screen.getByText(/0\.95 AU · SCHEMATIC · NOT TO SCALE/)).not.toBeNull();
  });
});
