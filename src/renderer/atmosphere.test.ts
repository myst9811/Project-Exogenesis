/**
 * @module renderer/atmosphere.test
 */

import { describe, expect, it } from 'vitest';

import { deriveAtmosphereAppearance } from './atmosphere';

const WHITE = { r: 1, g: 1, b: 1 };

describe('deriveAtmosphereAppearance', () => {
  it('reports no atmosphere for an airless world', () => {
    const result = deriveAtmosphereAppearance(0, WHITE);
    expect(result.present).toBe(false);
    expect(result.opacity).toBe(0);
  });

  it('reports no atmosphere for non-finite pressure', () => {
    expect(deriveAtmosphereAppearance(Number.NaN, WHITE).present).toBe(false);
  });

  it('produces a blue sky under a white star', () => {
    const { skyColorRgb } = deriveAtmosphereAppearance(101.325, WHITE);
    expect(skyColorRgb.b).toBeCloseTo(1, 5); // brightest channel normalized to 1
    expect(skyColorRgb.b).toBeGreaterThan(skyColorRgb.g);
    expect(skyColorRgb.g).toBeGreaterThan(skyColorRgb.r);
  });

  it('makes Earth-like pressure translucent (~0.63 opacity)', () => {
    expect(deriveAtmosphereAppearance(101.325, WHITE).opacity).toBeCloseTo(0.632, 2);
  });

  it('makes a Venusian column nearly opaque', () => {
    expect(deriveAtmosphereAppearance(9200, WHITE).opacity).toBeCloseTo(1, 3);
  });

  it('makes a Mars-like wisp barely visible but present', () => {
    const result = deriveAtmosphereAppearance(0.6, WHITE);
    expect(result.present).toBe(true);
    expect(result.opacity).toBeGreaterThan(0);
    expect(result.opacity).toBeLessThan(0.02);
  });

  it('boosts blue relative to the stellar ratio under a red dwarf', () => {
    const star = { r: 1, g: 0.4, b: 0.15 };
    const { skyColorRgb } = deriveAtmosphereAppearance(101.325, star);
    // Rayleigh lifts blue: the sky's blue:red ratio exceeds the star's.
    expect(skyColorRgb.b / skyColorRgb.r).toBeGreaterThan(star.b / star.r);
  });
});
