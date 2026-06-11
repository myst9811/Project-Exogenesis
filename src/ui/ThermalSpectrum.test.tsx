/**
 * @module ui/ThermalSpectrum.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ThermalSpectrum } from './ThermalSpectrum';

afterEach(cleanup);

describe('ThermalSpectrum', () => {
  it('labels the spectrum with the temperature and renders without a 2D context', () => {
    // jsdom provides no canvas 2D context; the component must not throw.
    render(<ThermalSpectrum temperatureKelvin={288} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('288 K');
  });
});
