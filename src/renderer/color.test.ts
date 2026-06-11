/**
 * @module renderer/color.test
 */

import { describe, expect, it } from 'vitest';

import { clamp01 } from './color';

describe('clamp01', () => {
  it('passes through a value already within range', () => {
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(1)).toBe(1);
  });

  it('clamps values below 0 up to 0', () => {
    expect(clamp01(-0.3)).toBe(0);
  });

  it('clamps values above 1 down to 1', () => {
    expect(clamp01(2.5)).toBe(1);
  });
});
