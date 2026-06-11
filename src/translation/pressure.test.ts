/**
 * @module translation/pressure.test
 */

import { describe, expect, it } from 'vitest';

import { translatePressure } from './pressure';

describe('translatePressure', () => {
  it.each([
    [0.5, 'Near-vacuum'],
    [30, 'Thin air'],
    [101.325, 'Earth-like pressure'],
    [300, 'Dense atmosphere'],
    [2000, 'Crushing atmosphere'],
    [9200, 'Extreme pressure'],
  ])('classifies %f kPa as %s', (pressure, brief) => {
    const result = translatePressure(pressure);
    expect(result.brief).toBe(brief);
    expect(result.earthComparison).toContain('1 atm');
  });

  it('reports Earth pressure as ~1.00 atm', () => {
    expect(translatePressure(101.325).narrative).toContain('1.00 atm');
  });
});
