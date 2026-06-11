/**
 * @module ui/DiagnosticsList.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { commitConfiguration, createAppStores, createDefaultConfiguration } from '../store';
import { DiagnosticsList } from './DiagnosticsList';
import { StoresProvider } from './StoresProvider';

afterEach(cleanup);

describe('DiagnosticsList', () => {
  it('renders nothing when there are no diagnostics', () => {
    const { container } = render(
      <StoresProvider stores={createAppStores()}>
        <DiagnosticsList />
      </StoresProvider>,
    );
    expect(container.querySelector('.diagnostics')).toBeNull();
  });

  it('lists an error diagnostic for an invalid configuration', async () => {
    const stores = createAppStores();
    const invalid = createDefaultConfiguration();
    invalid.planetary.massEarthMasses = 0; // fails validation
    await commitConfiguration(stores, invalid);

    render(
      <StoresProvider stores={stores}>
        <DiagnosticsList />
      </StoresProvider>,
    );
    expect(screen.getByText(/massEarthMasses/)).toBeTruthy();
    expect(screen.getByText('error')).toBeTruthy();
  });
});
