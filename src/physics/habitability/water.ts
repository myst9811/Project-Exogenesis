/**
 * @module physics/habitability/water
 *
 * Liquid-water surface conditions: the pressure-dependent boiling point
 * and whether liquid water can exist at the surface.
 *
 * Models implemented:
 *   - Boiling point vs. pressure via Clausius–Clapeyron
 *   - Liquid-water window: triple point ≤ P, freezing ≤ T ≤ boiling(P)
 *
 * Assumptions:
 *   - Pure water (no salinity or solute freezing/boiling-point shifts)
 *   - Latent heat of vaporization constant over the modeled range
 *
 * Future work:
 *   - Brine stability (salts extend the liquid range on cold worlds)
 *   - Pressure-dependent latent heat
 */

import type { ConfidenceLevel, LiquidWaterAssessment } from '../../types/habitability';
import {
  EARTH_SURFACE_PRESSURE_KILOPASCALS,
  MOLAR_GAS_CONSTANT_R,
  WATER_BOILING_POINT_STANDARD_KELVIN,
  WATER_FREEZING_POINT_KELVIN,
  WATER_LATENT_HEAT_VAPORIZATION_JOULES_PER_MOLE,
  WATER_TRIPLE_POINT_PRESSURE_KILOPASCALS,
} from '../constants';
import { PhysicsRangeError } from '../errors';

/**
 * Computes the boiling point of water at a given pressure.
 *
 * Equation (Clausius–Clapeyron, constant latent heat):
 *   1/T_b = 1/T₀ − (R / L) · ln(P / P₀)
 * with T₀ = 373.15 K and P₀ = 1 atm.
 *
 * Assumptions:
 *   - Latent heat of vaporization L is constant
 *   - Ideal-gas vapor; negligible liquid molar volume
 *
 * Simplifications:
 *   - The constant-L approximation drifts at very low pressure: near the
 *     triple point it underestimates the boiling point by a few Kelvin.
 *
 * Domain: Pressure at or above water's triple point (0.612 kPa); below
 * that no liquid phase exists and the boiling point is undefined.
 *
 * @param pressureKilopascals - Ambient pressure in kilopascals
 * @returns Boiling point of water in Kelvin
 *
 * @see Clausius–Clapeyron relation; constants in docs/references.md
 */
export function computeWaterBoilingPoint(pressureKilopascals: number): number {
  if (
    !Number.isFinite(pressureKilopascals) ||
    pressureKilopascals < WATER_TRIPLE_POINT_PRESSURE_KILOPASCALS
  ) {
    throw new PhysicsRangeError(
      'pressureKilopascals',
      pressureKilopascals,
      [WATER_TRIPLE_POINT_PRESSURE_KILOPASCALS, Infinity],
      'kPa',
    );
  }
  const inverseBoilingPoint =
    1 / WATER_BOILING_POINT_STANDARD_KELVIN -
    (MOLAR_GAS_CONSTANT_R / WATER_LATENT_HEAT_VAPORIZATION_JOULES_PER_MOLE) *
      Math.log(pressureKilopascals / EARTH_SURFACE_PRESSURE_KILOPASCALS);
  return 1 / inverseBoilingPoint;
}

/** Confidence of the liquid-water determination (first-principles, constant-L). */
const LIQUID_WATER_CONFIDENCE: ConfidenceLevel = 'calculated';

/**
 * Assesses whether liquid water can exist at the surface.
 *
 * Liquid water requires surface pressure at or above the triple point and
 * a temperature between freezing and the pressure-adjusted boiling point.
 *
 * @param surfaceTemperatureKelvin - Surface temperature in Kelvin
 * @param surfacePressureKilopascals - Total surface pressure in kilopascals
 * @returns The liquid-water assessment for this surface
 */
export function assessLiquidWater(
  surfaceTemperatureKelvin: number,
  surfacePressureKilopascals: number,
): LiquidWaterAssessment {
  if (!Number.isFinite(surfaceTemperatureKelvin) || surfaceTemperatureKelvin <= 0) {
    throw new PhysicsRangeError(
      'surfaceTemperatureKelvin',
      surfaceTemperatureKelvin,
      [0, Infinity],
      'K',
    );
  }
  if (!Number.isFinite(surfacePressureKilopascals) || surfacePressureKilopascals < 0) {
    throw new PhysicsRangeError(
      'surfacePressureKilopascals',
      surfacePressureKilopascals,
      [0, Infinity],
      'kPa',
    );
  }
  if (surfacePressureKilopascals < WATER_TRIPLE_POINT_PRESSURE_KILOPASCALS) {
    return {
      possible: false,
      confidence: LIQUID_WATER_CONFIDENCE,
      boilingPointKelvin: null,
      detail:
        'Surface pressure is below water’s triple point (0.61 kPa): ice sublimates ' +
        'directly to vapor and liquid water cannot exist, as on present-day Mars.',
    };
  }
  const boilingPointKelvin = computeWaterBoilingPoint(surfacePressureKilopascals);
  if (surfaceTemperatureKelvin < WATER_FREEZING_POINT_KELVIN) {
    return {
      possible: false,
      confidence: LIQUID_WATER_CONFIDENCE,
      boilingPointKelvin,
      detail: 'The surface is below the freezing point of water: any surface water is ice.',
    };
  }
  if (surfaceTemperatureKelvin > boilingPointKelvin) {
    return {
      possible: false,
      confidence: LIQUID_WATER_CONFIDENCE,
      boilingPointKelvin,
      detail:
        `The surface temperature exceeds water’s boiling point at this pressure ` +
        `(${Math.round(boilingPointKelvin)} K): surface water flashes to vapor.`,
    };
  }
  return {
    possible: true,
    confidence: LIQUID_WATER_CONFIDENCE,
    boilingPointKelvin,
    detail:
      `Liquid water is stable at the surface: the temperature lies between freezing ` +
      `(273 K) and the pressure-adjusted boiling point (${Math.round(boilingPointKelvin)} K).`,
  };
}
