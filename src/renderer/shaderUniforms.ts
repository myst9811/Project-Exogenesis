/**
 * @module renderer/shaderUniforms
 *
 * Derives the planet shader's uniforms from computed physics (CLAUDE.md §8).
 * Pure and total: reads computed state + the liquid-water assessment, reusing
 * the existing star/surface/atmosphere derivations rather than duplicating
 * them (ADR-002, §4 — physics types only). Continent placement is a
 * deterministic seed from the configuration hash (ADR-004), applied in-shader.
 */

import type { PlanetCompositionClass } from '../types/configuration';

/** Clamps a value to [0, 1]. */
function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Polar-ice extent from surface temperature: full ≤240 K, none ≥300 K. */
export function deriveIceFraction(surfaceTemperatureKelvin: number): number {
  return clamp01((300 - surfaceTemperatureKelvin) / 60);
}

/** Emissive lava strength: begins ~1000 K, full by 1400 K. */
export function deriveMoltenFactor(surfaceTemperatureKelvin: number): number {
  return clamp01((surfaceTemperatureKelvin - 1000) / 400);
}

/**
 * Sea-level threshold. A water-world is mostly ocean; otherwise oceans require
 * both that liquid water is thermodynamically possible and that water is
 * actually present (non-zero H2O partial pressure).
 */
export function deriveOceanLevel(
  compositionClass: PlanetCompositionClass,
  liquidWaterPossible: boolean,
  waterVaporKilopascals: number,
): number {
  if (compositionClass === 'water-world') {
    return 0.85;
  }
  const waterPresent = waterVaporKilopascals > 0;
  return liquidWaterPossible && waterPresent ? 0.5 : 0;
}

/** Cloud cover from water vapor and total pressure; none if dry or airless. */
export function deriveCloudDensity(
  waterVaporKilopascals: number,
  totalPressureKilopascals: number,
): number {
  if (waterVaporKilopascals <= 0 || totalPressureKilopascals <= 0) {
    return 0;
  }
  return clamp01(Math.sqrt(waterVaporKilopascals / 4)) * clamp01(totalPressureKilopascals / 40);
}

/** Relief amplitude by bulk composition. */
export const TERRAIN_ROUGHNESS: Record<PlanetCompositionClass, number> = {
  'rocky-silicate': 0.8,
  'iron-rich': 0.7,
  'water-world': 0.3,
  'gas-dwarf': 0.15,
};

/** Deterministic terrain seed from the configuration hash (ADR-004). */
export function deriveTerrainSeed(configurationHash: string): number {
  const slice = configurationHash.slice(0, 8) || '0';
  return (parseInt(slice, 16) % 1_000_000) / 1000;
}

/** Visual spin: a 24 h day turns once per 60 s on screen; sign = direction. */
const VISUAL_DAY_SECONDS = 60;
export function deriveSpin(rotationPeriodHours: number): number {
  const hours = rotationPeriodHours === 0 ? 24 : rotationPeriodHours;
  const visualSeconds = Math.min(
    600,
    Math.max(10, (Math.abs(hours) / 24) * VISUAL_DAY_SECONDS),
  );
  return (Math.sign(hours) * (2 * Math.PI)) / visualSeconds;
}
