/**
 * @module renderer/star.test
 */

import { describe, expect, it } from 'vitest';

import { deriveBlackbodyColor, deriveStarAngularRadius } from './star';

describe('deriveBlackbodyColor', () => {
  it('produces a warm near-white for the Sun (~5772 K)', () => {
    const color = deriveBlackbodyColor(5772);
    expect(color.r).toBeCloseTo(1, 1); // red saturated below 6600 K
    expect(color.g).toBeGreaterThan(0.85);
    expect(color.b).toBeGreaterThan(0.9);
    expect(color.b).toBeLessThan(color.r + 1e-9); // slightly warm: blue ≤ red
  });

  it('produces a red-dominant color for a cool M dwarf (~3000 K)', () => {
    const color = deriveBlackbodyColor(3000);
    expect(color.r).toBe(1);
    expect(color.r).toBeGreaterThan(color.b);
    expect(color.b).toBeLessThan(0.5);
  });

  it('produces a blue-dominant color for a hot star (~12000 K)', () => {
    const color = deriveBlackbodyColor(12_000);
    expect(color.b).toBe(1);
    expect(color.b).toBeGreaterThan(color.r);
  });

  it('clamps below the domain minimum (cool) and stays red', () => {
    const color = deriveBlackbodyColor(200);
    expect(color.r).toBe(1);
    expect(color.b).toBe(0);
  });

  it('clamps above the domain maximum without exceeding [0, 1]', () => {
    const color = deriveBlackbodyColor(100_000);
    for (const channel of [color.r, color.g, color.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    }
  });

  it('treats non-finite input as the domain minimum', () => {
    expect(deriveBlackbodyColor(Number.NaN)).toEqual(deriveBlackbodyColor(1000));
  });
});

describe('deriveStarAngularRadius', () => {
  it('produces ~0.0047 rad for the Sun seen from 1 AU', () => {
    // R_sun 6.957e8 m, 1 AU 1.496e11 m → angular diameter ≈ 0.53°.
    const radius = deriveStarAngularRadius(6.957e8, 1.496e11);
    expect(radius).toBeCloseTo(0.00465, 4);
    expect((radius * 2 * 180) / Math.PI).toBeCloseTo(0.53, 1);
  });

  it('grows as the planet moves closer', () => {
    const near = deriveStarAngularRadius(6.957e8, 0.4e11);
    const far = deriveStarAngularRadius(6.957e8, 1.5e11);
    expect(near).toBeGreaterThan(far);
  });

  it('returns 0 for non-positive or non-finite inputs', () => {
    expect(deriveStarAngularRadius(0, 1.5e11)).toBe(0);
    expect(deriveStarAngularRadius(6.957e8, 0)).toBe(0);
    expect(deriveStarAngularRadius(6.957e8, Number.NaN)).toBe(0);
    expect(deriveStarAngularRadius(Infinity, 1.5e11)).toBe(0);
  });
});
