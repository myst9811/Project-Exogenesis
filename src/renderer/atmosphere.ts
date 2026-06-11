/**
 * @module renderer/atmosphere
 *
 * Derives atmosphere appearance from surface pressure and the stellar
 * spectrum (CLAUDE.md §8: sky color from Rayleigh scattering coefficients
 * and stellar spectrum; opacity from optical depth).
 *
 * Model: Rayleigh scattering favors short wavelengths as 1/λ⁴, so the sky
 * shows the stellar spectrum re-weighted toward blue. Shell opacity rises
 * with atmospheric column (total surface pressure). Per-gas spectral
 * absorption (CO₂/CH₄ tinting) and Mie/particulate haze are deferred — the
 * MVP does not invent per-gas optical constants it cannot cite (§6).
 */

import type { ColorRGB } from '../types/render';
import type { AtmosphereRenderParameters } from '../types/render';

/** Representative RGB wavelengths in nanometres (sRGB primaries, approx). */
const WAVELENGTH_RED_NM = 700;
const WAVELENGTH_GREEN_NM = 530;
const WAVELENGTH_BLUE_NM = 440;

/** One standard atmosphere in kPa (definitional), the opacity reference. */
const EARTH_SURFACE_PRESSURE_KILOPASCALS = 101.325;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Relative Rayleigh scattering efficiency at a wavelength (∝ 1/λ⁴). */
function rayleighWeight(wavelengthNm: number): number {
  return 1 / wavelengthNm ** 4;
}

/**
 * Derives the atmosphere's sky color and opacity.
 *
 * Sky color: the stellar color with each channel scaled by its Rayleigh
 * weight, then normalized to full brightness (hue preserved). A white star
 * yields a blue sky; a red dwarf yields a dim, redder sky — emergent from
 * the inputs, not authored.
 *
 * Opacity: 1 − exp(−P / P⊕), so Earth-like pressure is translucent
 * (~0.63), a Venusian column is opaque (~1), and a wisp like Mars is barely
 * visible.
 *
 * @param surfacePressureKilopascals - Total surface pressure in kPa
 * @param starColorRgb - The host star's sRGB color
 * @returns Atmosphere render parameters (present = false for an airless world)
 */
export function deriveAtmosphereAppearance(
  surfacePressureKilopascals: number,
  starColorRgb: ColorRGB,
): AtmosphereRenderParameters {
  if (!Number.isFinite(surfacePressureKilopascals) || surfacePressureKilopascals <= 0) {
    return { present: false, skyColorRgb: { r: 0, g: 0, b: 0 }, opacity: 0 };
  }

  const scatteredR = starColorRgb.r * rayleighWeight(WAVELENGTH_RED_NM);
  const scatteredG = starColorRgb.g * rayleighWeight(WAVELENGTH_GREEN_NM);
  const scatteredB = starColorRgb.b * rayleighWeight(WAVELENGTH_BLUE_NM);
  const brightest = Math.max(scatteredR, scatteredG, scatteredB);

  const skyColorRgb: ColorRGB =
    brightest > 0
      ? { r: scatteredR / brightest, g: scatteredG / brightest, b: scatteredB / brightest }
      : { r: 0, g: 0, b: 0 };

  const opacity = clamp01(
    1 - Math.exp(-surfacePressureKilopascals / EARTH_SURFACE_PRESSURE_KILOPASCALS),
  );

  return { present: true, skyColorRgb, opacity };
}
