/**
 * @module types/render
 *
 * The visual-parameter contract: the output of the renderer's pure
 * derivation layer and the input to its Three.js scene. Every field is
 * derived from `PlanetaryState` (ADR-002, CLAUDE.md §8); no visual value is
 * authored. Colors are sRGB display colors with each channel in [0, 1].
 */

/** sRGB display color, each channel in [0, 1]. */
export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

/** Derived appearance of the host star. */
export interface StarRenderParameters {
  /** Blackbody color from the stellar effective temperature. */
  colorRgb: ColorRGB;
  /** Apparent angular radius from the planet, in radians. */
  angularRadiusRadians: number;
}

/** Derived appearance of the planet surface. */
export interface PlanetRenderParameters {
  /** Surface color from composition class, modulated by bond albedo. */
  surfaceColorRgb: ColorRGB;
}

/** Derived appearance of the atmosphere. */
export interface AtmosphereRenderParameters {
  /** False for an airless world; the scene then draws no atmosphere shell. */
  present: boolean;
  /** Zenith sky color from Rayleigh scattering of the stellar spectrum. */
  skyColorRgb: ColorRGB;
  /** Shell opacity in [0, 1], rising with atmospheric column (pressure). */
  opacity: number;
}

/**
 * The complete uniform set the planet shader consumes. Every field is derived
 * from computed physics by `deriveShaderUniforms` (CLAUDE.md §8). Colors are
 * sRGB in [0, 1]; fractions are clamped to [0, 1] unless noted.
 */
export interface PlanetShaderUniforms {
  /** Base surface palette from composition × bond albedo. */
  surfaceColorRgb: ColorRGB;
  /** Polar-ice extent, 0 (none) → 1 (snowball), from surface temperature. */
  iceFraction: number;
  /** Sea level threshold, 0 (no oceans) → ~0.85, gated by liquid-water + water. */
  oceanLevel: number;
  /** Emissive lava strength, 0 → 1, when scorching. */
  moltenFactor: number;
  /** Deterministic procedural-terrain seed from the configuration hash. */
  terrainSeed: number;
  /** Relief amplitude, 0 (smooth) → 1 (rugged), from composition. */
  terrainRoughness: number;
  /** False for an airless world. */
  atmospherePresent: boolean;
  /** Rayleigh tint of the stellar spectrum (limb glow color). */
  skyColorRgb: ColorRGB;
  /** Atmospheric column depth, 0 → 1, from surface pressure. */
  atmosphereThickness: number;
  /** Cloud cover, 0 → 1, from water vapor × pressure. */
  cloudDensity: number;
  /** Blackbody star color. */
  starColorRgb: ColorRGB;
  /** Star apparent angular radius in radians (sizes the disc). */
  starAngularRadius: number;
  /** Visual spin in rad/s; sign sets prograde/retrograde. */
  spinRadiansPerSecond: number;
}

/** Which curated camera framing of the computed world the viewport shows. */
export type PlanetView = 'observation' | 'surface' | 'system';
