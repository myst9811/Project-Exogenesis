/**
 * @module physics/habitability/water.test
 */

import { describe, expect, it } from 'vitest';

import { EARTH_SURFACE_PRESSURE_KILOPASCALS } from '../constants';
import { PhysicsRangeError } from '../errors';
import { assessLiquidWater, computeWaterBoilingPoint } from './water';

describe('computeWaterBoilingPoint', () => {
  it('produces 373.15 K at 1 standard atmosphere (calibration anchor)', () => {
    expect(computeWaterBoilingPoint(EARTH_SURFACE_PRESSURE_KILOPASCALS)).toBeCloseTo(373.15, 2);
  });

  it('produces ~344 K (≈71 °C) on Everest-summit pressure (~33.7 kPa)', () => {
    // Water boils near 71 °C at the summit of Everest; constant-L C–C gives ~70 °C.
    const result = computeWaterBoilingPoint(33.7);
    expect(result).toBeGreaterThan(338);
    expect(result).toBeLessThan(348);
  });

  it('falls below freezing-range boiling for thick atmospheres (rises with pressure)', () => {
    const earth = computeWaterBoilingPoint(EARTH_SURFACE_PRESSURE_KILOPASCALS);
    const venusLike = computeWaterBoilingPoint(9200);
    expect(venusLike).toBeGreaterThan(earth);
  });

  it('throws PhysicsRangeError below the triple-point pressure', () => {
    expect(() => computeWaterBoilingPoint(0.5)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for non-finite pressure', () => {
    expect(() => computeWaterBoilingPoint(Number.NaN)).toThrow(PhysicsRangeError);
  });
});

describe('assessLiquidWater', () => {
  it('reports liquid water possible for Earth surface conditions (288 K, 101 kPa)', () => {
    const result = assessLiquidWater(288, EARTH_SURFACE_PRESSURE_KILOPASCALS);
    expect(result.possible).toBe(true);
    expect(result.boilingPointKelvin).toBeCloseTo(373.15, 1);
    expect(result.confidence).toBe('calculated');
  });

  it('reports no liquid water below the triple-point pressure (Mars, 0.6 kPa)', () => {
    const result = assessLiquidWater(210, 0.6);
    expect(result.possible).toBe(false);
    expect(result.boilingPointKelvin).toBeNull();
    expect(result.detail).toContain('triple point');
  });

  it('reports no liquid water when the surface is frozen (250 K, 101 kPa)', () => {
    const result = assessLiquidWater(250, EARTH_SURFACE_PRESSURE_KILOPASCALS);
    expect(result.possible).toBe(false);
    expect(result.boilingPointKelvin).toBeCloseTo(373.15, 1);
    expect(result.detail).toContain('ice');
  });

  it('reports no liquid water when the surface is above boiling (400 K, 101 kPa)', () => {
    const result = assessLiquidWater(400, EARTH_SURFACE_PRESSURE_KILOPASCALS);
    expect(result.possible).toBe(false);
    expect(result.detail).toContain('vapor');
  });

  it('allows liquid water above 373 K under high pressure (450 K, 9200 kPa)', () => {
    const result = assessLiquidWater(450, 9200);
    expect(result.possible).toBe(true);
    expect(result.boilingPointKelvin ?? 0).toBeGreaterThan(450);
  });

  it('throws PhysicsRangeError for non-positive temperature', () => {
    expect(() => assessLiquidWater(0, EARTH_SURFACE_PRESSURE_KILOPASCALS)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError for negative pressure', () => {
    expect(() => assessLiquidWater(288, -1)).toThrow(PhysicsRangeError);
  });
});
