/**
 * @module translation/temperature.test
 */

import { describe, expect, it } from 'vitest';

import { translateSurfaceTemperature } from './temperature';

describe('translateSurfaceTemperature', () => {
  it.each([
    [100, 'Cryogenic cold'],
    [200, 'Extreme cold'],
    [260, 'Subfreezing'],
    [288, 'Temperate'],
    [315, 'Hot'],
    [350, 'Searing'],
    [450, 'Scorching'],
    [700, 'Infernal'],
  ])('classifies %d K as %s', (kelvin, brief) => {
    const result = translateSurfaceTemperature(kelvin);
    expect(result.brief).toBe(brief);
    expect(result.earthComparison).toContain('288 K');
  });

  it('reports Earth surface temperature as ~15 °C', () => {
    expect(translateSurfaceTemperature(288).narrative).toContain('15 °C');
  });

  it('renders sub-zero Celsius for cold worlds', () => {
    expect(translateSurfaceTemperature(200).narrative).toContain('-73 °C');
  });
});
