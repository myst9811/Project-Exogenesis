/**
 * @module renderer/star
 *
 * Derives the host star's appearance from physics state: its blackbody
 * color from effective temperature, and its apparent angular size from
 * radius and orbital distance (CLAUDE.md §8).
 *
 * These are pure derivation functions — read-only consumers of computed
 * values (ADR-002). They are total: defensive against degenerate inputs
 * rather than throwing, since they run downstream of validated physics.
 */

import type { ColorRGB } from '../types/render';
import { clamp01 } from './color';

/** Valid domain of the blackbody-color approximation (Kelvin). */
const MIN_BLACKBODY_KELVIN = 1000;
const MAX_BLACKBODY_KELVIN = 40_000;

/**
 * Approximates the sRGB color of a blackbody at a given temperature.
 *
 * Physical basis: the Planckian locus — the chromaticity of an ideal
 * thermal radiator as temperature varies (cool → red, ~5800 K → white,
 * hot → blue). This uses Tanner Helland's published piecewise fit to that
 * locus rather than integrating Planck's law against CIE color-matching
 * functions; it is an ESTIMATE accurate to a few percent over its domain.
 *
 * Domain: clamped to 1000–40000 K.
 *
 * @param temperatureKelvin - Stellar effective temperature in Kelvin
 * @returns sRGB color, each channel in [0, 1]
 *
 * @see Tanner Helland, "How to Convert Temperature (K) to RGB" (2012)
 */
export function deriveBlackbodyColor(temperatureKelvin: number): ColorRGB {
  const kelvin = Math.min(
    MAX_BLACKBODY_KELVIN,
    Math.max(MIN_BLACKBODY_KELVIN, Number.isFinite(temperatureKelvin) ? temperatureKelvin : MIN_BLACKBODY_KELVIN),
  );
  const t = kelvin / 100;

  const red =
    t <= 66 ? 255 : 329.698_727_446 * (t - 60) ** -0.133_204_759_2;
  const green =
    t <= 66
      ? 99.470_802_586_1 * Math.log(t) - 161.119_568_166_1
      : 288.122_169_528_3 * (t - 60) ** -0.075_514_849_2;
  let blue: number;
  if (t >= 66) {
    blue = 255;
  } else if (t <= 19) {
    blue = 0;
  } else {
    blue = 138.517_731_223_1 * Math.log(t - 10) - 305.044_792_730_7;
  }

  return {
    r: clamp01(red / 255),
    g: clamp01(green / 255),
    b: clamp01(blue / 255),
  };
}

/**
 * Computes the star's apparent angular radius as seen from the planet.
 *
 * Equation: θ = atan(R_star / d), with d the orbital distance.
 *
 * @param stellarRadiusMeters - Stellar radius in meters
 * @param orbitalDistanceMeters - Planet–star distance in meters
 * @returns Apparent angular radius in radians (0 for degenerate inputs)
 */
export function deriveStarAngularRadius(
  stellarRadiusMeters: number,
  orbitalDistanceMeters: number,
): number {
  if (
    !Number.isFinite(stellarRadiusMeters) ||
    !Number.isFinite(orbitalDistanceMeters) ||
    stellarRadiusMeters <= 0 ||
    orbitalDistanceMeters <= 0
  ) {
    return 0;
  }
  return Math.atan(stellarRadiusMeters / orbitalDistanceMeters);
}
