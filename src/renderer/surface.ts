/**
 * @module renderer/surface
 *
 * Derives planet surface color from bulk composition and bond albedo
 * (CLAUDE.md §8: "surface color | surface composition weighted by albedo").
 *
 * The per-composition base hues are a representational colormap — a
 * visualization choice for how each composition class is *drawn*, not a
 * physical constant. The physical bond albedo modulates brightness: a
 * low-albedo world renders darker, a high-albedo world brighter, tying the
 * rendered luminance to a computed physical quantity.
 */

import type { PlanetCompositionClass } from '../types/configuration';
import type { ColorRGB } from '../types/render';

/**
 * Representational base hues per composition class (sRGB, [0, 1]). Chosen to
 * read as the material at a glance — silicate rock tan, iron-rich dark
 * rust, water-world ocean blue, gas-dwarf pale cream — then scaled by albedo.
 */
const COMPOSITION_BASE_COLOR: Record<PlanetCompositionClass, ColorRGB> = {
  'rocky-silicate': { r: 0.62, g: 0.5, b: 0.38 },
  'iron-rich': { r: 0.5, g: 0.34, b: 0.3 },
  'water-world': { r: 0.2, g: 0.42, b: 0.68 },
  'gas-dwarf': { r: 0.78, g: 0.74, b: 0.62 },
};

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Derives surface color: the composition's base hue scaled by a brightness
 * factor rising with bond albedo.
 *
 * Brightness factor: 0.5 + albedo (clamped per channel). A dark, low-albedo
 * body (Mercury-like, A≈0.09) renders dim; a bright, high-albedo body
 * (icy/cloudy) renders luminous.
 *
 * @param compositionClass - Bulk composition class
 * @param bondAlbedo - Bond albedo (dimensionless, [0, 1])
 * @returns Surface sRGB color, each channel in [0, 1]
 */
export function deriveSurfaceColor(
  compositionClass: PlanetCompositionClass,
  bondAlbedo: number,
): ColorRGB {
  const base = COMPOSITION_BASE_COLOR[compositionClass];
  const albedo = Number.isFinite(bondAlbedo) ? clamp01(bondAlbedo) : 0;
  const brightness = 0.5 + albedo;
  return {
    r: clamp01(base.r * brightness),
    g: clamp01(base.g * brightness),
    b: clamp01(base.b * brightness),
  };
}
