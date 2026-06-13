/**
 * @module ui/SystemHeader.test
 * @vitest-environment jsdom
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { createAppStores } from '../store';
import { StoresProvider } from './StoresProvider';
import { SystemHeader } from './SystemHeader';

afterEach(cleanup);

describe('SystemHeader', () => {
  it('renders the rocket brand mark in the header-left', () => {
    const { container } = render(
      <StoresProvider stores={createAppStores()}>
        <SystemHeader />
      </StoresProvider>,
    );
    const brand = container.querySelector('.header-left .mission-icon');
    expect(brand).not.toBeNull();
    expect(brand?.querySelector('svg')).not.toBeNull();
  });
});
