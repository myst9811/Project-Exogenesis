/**
 * @module ui/WorldIdentity.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { WorldIdentity } from './WorldIdentity';

afterEach(cleanup);

describe('WorldIdentity', () => {
  it('shows only the designation when there is no common name', () => {
    render(<WorldIdentity designation="EXO-A3F2B1" commonName={null} size="hud" />);
    expect(screen.getByText('EXO-A3F2B1')).not.toBeNull();
    expect(screen.queryByText(/Common name/i)).toBeNull();
  });

  it('shows the common name prominently with the designation beneath', () => {
    render(<WorldIdentity designation="EXO-A3F2B1" commonName="Aurelia" size="hud" />);
    expect(screen.getByText('Aurelia')).not.toBeNull();
    expect(screen.getByText(/EXO-A3F2B1|A3F2B1/)).not.toBeNull();
  });
});
