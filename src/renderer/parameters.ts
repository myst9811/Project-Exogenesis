/**
 * @module renderer/parameters
 *
 * The renderer's top-level derivation: maps an immutable `PlanetaryState`
 * to `RenderParameters` for the Three.js scene. Pure and total — it reads
 * computed state and physics *types* only, never physics calculation code
 * (ADR-002, CLAUDE.md §4). The scene consumes the result and authors
 * nothing of its own.
 */

import type { PlanetaryState } from '../types/physics';
import type { RenderParameters } from '../types/render';
import { deriveAtmosphereAppearance } from './atmosphere';
import { deriveBlackbodyColor, deriveStarAngularRadius } from './star';
import { deriveSurfaceColor } from './surface';

/**
 * Derives the complete visual description of a world from its state.
 *
 * @param state - The computed planetary state
 * @returns The render parameters for the scene
 */
export function deriveRenderParameters(state: PlanetaryState): RenderParameters {
  const starColorRgb = deriveBlackbodyColor(state.stellar.effectiveTemperatureKelvin);
  return {
    star: {
      colorRgb: starColorRgb,
      angularRadiusRadians: deriveStarAngularRadius(
        state.stellar.radiusMeters,
        state.orbit.semiMajorAxisMeters,
      ),
    },
    planet: {
      surfaceColorRgb: deriveSurfaceColor(
        state.configuration.planetary.compositionClass,
        state.climate.bondAlbedo,
      ),
    },
    atmosphere: deriveAtmosphereAppearance(
      state.atmosphere.surfacePressureKilopascals,
      starColorRgb,
    ),
  };
}
