/**
 * @module translation/magnetism.test
 */

import { describe, expect, it } from 'vitest';

import { translateMagneticField } from './magnetism';

describe('translateMagneticField', () => {
  it.each([
    [0, 'Negligible magnetic field'],
    [10e-6, 'Weak magnetic field'],
    [50e-6, 'Earth-like magnetic field'],
    [200e-6, 'Strong magnetic field'],
    [2e-3, 'Intense magnetic field'],
  ])('classifies %d T as %s', (tesla, brief) => {
    const result = translateMagneticField(tesla);
    expect(result.brief).toBe(brief);
    expect(result.earthComparison).toContain('50 µT');
  });

  it('reports the Earth-like field in microtesla', () => {
    expect(translateMagneticField(50e-6).narrative).toContain('50 µT');
  });
});
