/**
 * @module renderer/surface.test
 */

import { describe, expect, it } from 'vitest';

import { deriveSurfaceColor } from './surface';

describe('deriveSurfaceColor', () => {
  it('renders a water world blue-dominant', () => {
    const color = deriveSurfaceColor('water-world', 0.306);
    expect(color.b).toBeGreaterThan(color.r);
    expect(color.b).toBeGreaterThan(color.g);
  });

  it('renders rocky silicate warm (red ≥ blue)', () => {
    const color = deriveSurfaceColor('rocky-silicate', 0.306);
    expect(color.r).toBeGreaterThan(color.b);
  });

  it('renders a low-albedo iron world darker than a high-albedo one', () => {
    const dark = deriveSurfaceColor('iron-rich', 0.088);
    const bright = deriveSurfaceColor('iron-rich', 0.6);
    const luminance = (c: { r: number; g: number; b: number }): number => c.r + c.g + c.b;
    expect(luminance(bright)).toBeGreaterThan(luminance(dark));
  });

  it('scales brightness with albedo for a fixed composition', () => {
    const low = deriveSurfaceColor('rocky-silicate', 0.1);
    const high = deriveSurfaceColor('rocky-silicate', 0.5);
    expect(high.r).toBeGreaterThan(low.r);
  });

  it('keeps every channel within [0, 1] even at maximum albedo', () => {
    const color = deriveSurfaceColor('gas-dwarf', 1);
    for (const channel of [color.r, color.g, color.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    }
  });

  it('treats non-finite albedo as zero (darkest)', () => {
    const color = deriveSurfaceColor('rocky-silicate', Number.NaN);
    expect(color).toEqual(deriveSurfaceColor('rocky-silicate', 0));
  });
});
