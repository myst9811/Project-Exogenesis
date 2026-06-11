/**
 * @module physics/climate/index.test
 */

import { describe, expect, it } from 'vitest';

import {
  ASTRONOMICAL_UNIT_AU,
  NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
  NOMINAL_SOLAR_RADIUS_R_SUN,
} from '../constants';
import { PhysicsRangeError } from '../errors';
import {
  computeEquilibriumTemperature,
  computeGreenhouseSurfaceTemperature,
  estimateBondAlbedo,
  estimateGreenhouseOpticalDepth,
} from './index';

/** Earth baseline atmosphere (matches earthBaseline.ts). */
const EARTH_AIR = { N2: 78.08, O2: 20.95, Ar: 0.93, CO2: 0.04, H2O: 1.3 };

describe('estimateBondAlbedo', () => {
  it('returns the fact-sheet-anchored albedo for each composition class', () => {
    expect(estimateBondAlbedo('rocky-silicate')).toBeCloseTo(0.306, 3);
    expect(estimateBondAlbedo('iron-rich')).toBeCloseTo(0.088, 3);
    expect(estimateBondAlbedo('water-world')).toBeCloseTo(0.306, 3);
    expect(estimateBondAlbedo('gas-dwarf')).toBeCloseTo(0.29, 2);
  });
});

describe('computeEquilibriumTemperature', () => {
  it('produces ~254 K for Earth (bare rock, bond albedo 0.306)', () => {
    const result = computeEquilibriumTemperature(
      NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
      ASTRONOMICAL_UNIT_AU,
      0.306,
    );
    expect(result).toBeCloseTo(254, 0);
  });

  it('produces ~210 K for Mars (1.524 AU, albedo 0.25)', () => {
    const result = computeEquilibriumTemperature(
      NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
      1.524 * ASTRONOMICAL_UNIT_AU,
      0.25,
    );
    expect(result).toBeCloseTo(210, 0);
  });

  it('produces ~400 K for TRAPPIST-1b (Gillon et al. 2017: 400.1 ± 7.7 K at zero albedo)', () => {
    // TRAPPIST-1: T_eff = 2559 K, R = 0.117 R☉; planet b: a = 0.01154 AU.
    const result = computeEquilibriumTemperature(
      2559,
      0.117 * NOMINAL_SOLAR_RADIUS_R_SUN,
      0.01154 * ASTRONOMICAL_UNIT_AU,
      0,
    );
    expect(Math.abs(result - 400.1) / 400.1).toBeLessThan(0.03);
  });

  it('produces 0 K for a perfectly reflective planet (albedo 1)', () => {
    const result = computeEquilibriumTemperature(
      NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
      ASTRONOMICAL_UNIT_AU,
      1,
    );
    expect(result).toBe(0);
  });

  it('throws PhysicsRangeError for non-positive stellar temperature', () => {
    expect(() =>
      computeEquilibriumTemperature(0, NOMINAL_SOLAR_RADIUS_R_SUN, ASTRONOMICAL_UNIT_AU, 0.3),
    ).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for non-positive stellar radius', () => {
    expect(() => computeEquilibriumTemperature(5772, -1, ASTRONOMICAL_UNIT_AU, 0.3)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError for non-finite semi-major axis', () => {
    expect(() =>
      computeEquilibriumTemperature(5772, NOMINAL_SOLAR_RADIUS_R_SUN, Number.NaN, 0.3),
    ).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for albedo outside [0, 1]', () => {
    expect(() =>
      computeEquilibriumTemperature(5772, NOMINAL_SOLAR_RADIUS_R_SUN, ASTRONOMICAL_UNIT_AU, 1.2),
    ).toThrow(PhysicsRangeError);
  });
});

describe('estimateGreenhouseOpticalDepth', () => {
  it('produces τ ≈ 1.30 for the Earth baseline atmosphere (calibration anchor)', () => {
    expect(estimateGreenhouseOpticalDepth(EARTH_AIR)).toBeCloseTo(1.3, 2);
  });

  it('produces 0 for an airless world', () => {
    expect(estimateGreenhouseOpticalDepth({})).toBe(0);
  });

  it('produces 0 for an atmosphere with no greenhouse gases', () => {
    expect(estimateGreenhouseOpticalDepth({ N2: 79, O2: 21 })).toBe(0);
  });

  it('skips greenhouse gases present at zero pressure', () => {
    expect(estimateGreenhouseOpticalDepth({ N2: 80, CO2: 0 })).toBe(0);
  });

  it('reduces optical depth in thin atmospheres via pressure broadening (Mars-like)', () => {
    // √p scaling alone would give τ ≈ 1.43; broadening cuts it to ~0.11.
    const result = estimateGreenhouseOpticalDepth({ CO2: 0.6, N2: 0.03 });
    expect(result).toBeGreaterThan(0.09);
    expect(result).toBeLessThan(0.13);
  });

  it('caps the broadening factor at 1 for thick atmospheres (Venus-like)', () => {
    const result = estimateGreenhouseOpticalDepth({ CO2: 8975, N2: 325 });
    expect(result).toBeCloseTo(175, 0);
  });
});

describe('computeGreenhouseSurfaceTemperature', () => {
  it('returns the equilibrium temperature unchanged for τ = 0', () => {
    expect(computeGreenhouseSurfaceTemperature(254, 0)).toBe(254);
  });

  it('produces ~288 K for Earth end-to-end (T_eq 254 K + baseline greenhouse)', () => {
    const equilibrium = computeEquilibriumTemperature(
      NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
      ASTRONOMICAL_UNIT_AU,
      0.306,
    );
    const result = computeGreenhouseSurfaceTemperature(
      equilibrium,
      estimateGreenhouseOpticalDepth(EARTH_AIR),
    );
    expect(result).toBeCloseTo(288, 0);
  });

  it('produces a Venus-like surface temperature within 10% (computed ~696 K vs 737 K observed)', () => {
    // Venus: a = 0.723 AU, bond albedo 0.77, ~8,975 kPa CO₂ (NASA fact sheet).
    const equilibrium = computeEquilibriumTemperature(
      NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
      0.723 * ASTRONOMICAL_UNIT_AU,
      0.77,
    );
    const result = computeGreenhouseSurfaceTemperature(
      equilibrium,
      estimateGreenhouseOpticalDepth({ CO2: 8975, N2: 325 }),
    );
    expect(Math.abs(result - 737) / 737).toBeLessThan(0.1);
  });

  it('produces a Mars-like surface temperature (~213 K, observed mean ~210 K)', () => {
    const equilibrium = computeEquilibriumTemperature(
      NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
      1.524 * ASTRONOMICAL_UNIT_AU,
      0.25,
    );
    const result = computeGreenhouseSurfaceTemperature(
      equilibrium,
      estimateGreenhouseOpticalDepth({ CO2: 0.6, N2: 0.03 }),
    );
    expect(result).toBeGreaterThan(208);
    expect(result).toBeLessThan(218);
  });

  it('throws PhysicsRangeError for non-positive equilibrium temperature', () => {
    expect(() => computeGreenhouseSurfaceTemperature(0, 1)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for negative optical depth', () => {
    expect(() => computeGreenhouseSurfaceTemperature(254, -0.1)).toThrow(PhysicsRangeError);
  });
});
