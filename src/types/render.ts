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

/** The complete derived visual description of a world. */
export interface RenderParameters {
  star: StarRenderParameters;
  planet: PlanetRenderParameters;
  atmosphere: AtmosphereRenderParameters;
}
