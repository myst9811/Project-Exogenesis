/**
 * @module physics/stellar/index.test
 */

import { describe, expect, it } from 'vitest';

import {
  NOMINAL_SOLAR_LUMINOSITY_L_SUN,
  NOMINAL_SOLAR_RADIUS_R_SUN,
  SOLAR_MASS_KILOGRAMS,
} from '../constants';
import { PhysicsRangeError } from '../errors';
import {
  computeEffectiveTemperature,
  estimateMainSequenceLuminosity,
  estimateMainSequenceRadius,
} from './index';

describe('estimateMainSequenceLuminosity', () => {
  it('produces exactly 1 L☉ for 1 M☉ (relation is solar-normalized)', () => {
    const result = estimateMainSequenceLuminosity(SOLAR_MASS_KILOGRAMS);
    expect(result).toBeCloseTo(NOMINAL_SOLAR_LUMINOSITY_L_SUN, -20);
  });

  it('produces ~0.0018 L☉ for Proxima Centauri (0.122 M☉, observed 0.0016 L☉)', () => {
    // Anglada-Escudé et al. (2016), Nature 536, 437: M = 0.122 M☉, L ≈ 0.00155 L☉.
    // Empirical relation scatter at the low-mass end is ~20%.
    const result = estimateMainSequenceLuminosity(0.122 * SOLAR_MASS_KILOGRAMS);
    const relativeToObserved = result / (0.00155 * NOMINAL_SOLAR_LUMINOSITY_L_SUN);
    expect(relativeToObserved).toBeGreaterThan(0.8);
    expect(relativeToObserved).toBeLessThan(1.3);
  });

  it('uses the intermediate-mass branch for a 10 M☉ B star (~4400 L☉)', () => {
    const result = estimateMainSequenceLuminosity(10 * SOLAR_MASS_KILOGRAMS);
    expect(result / NOMINAL_SOLAR_LUMINOSITY_L_SUN).toBeCloseTo(1.4 * 10 ** 3.5, 0);
  });

  it('uses the linear branch above 55 M☉', () => {
    const result = estimateMainSequenceLuminosity(100 * SOLAR_MASS_KILOGRAMS);
    expect(result / NOMINAL_SOLAR_LUMINOSITY_L_SUN).toBeCloseTo(3.2e6, -5);
  });

  it('throws PhysicsRangeError below the hydrogen-burning limit', () => {
    expect(() => estimateMainSequenceLuminosity(0.05 * SOLAR_MASS_KILOGRAMS)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError for non-finite mass', () => {
    expect(() => estimateMainSequenceLuminosity(Number.NaN)).toThrow(PhysicsRangeError);
  });
});

describe('estimateMainSequenceRadius', () => {
  it('produces ~1.06 R☉ for the Sun (documented relation offset)', () => {
    const result = estimateMainSequenceRadius(SOLAR_MASS_KILOGRAMS);
    expect(result / NOMINAL_SOLAR_RADIUS_R_SUN).toBeCloseTo(1.06, 2);
  });

  it('produces ~0.145 R☉ for Proxima Centauri (observed 0.154 R☉)', () => {
    // Anglada-Escudé et al. (2016): R = 0.141–0.154 R☉.
    const result = estimateMainSequenceRadius(0.122 * SOLAR_MASS_KILOGRAMS);
    const radiusSolar = result / NOMINAL_SOLAR_RADIUS_R_SUN;
    expect(radiusSolar).toBeGreaterThan(0.12);
    expect(radiusSolar).toBeLessThan(0.17);
  });

  it('uses the high-mass branch above 1.66 M☉', () => {
    const result = estimateMainSequenceRadius(10 * SOLAR_MASS_KILOGRAMS);
    expect(result / NOMINAL_SOLAR_RADIUS_R_SUN).toBeCloseTo(1.33 * 10 ** 0.555, 2);
  });

  it('throws PhysicsRangeError above the maximum stellar mass', () => {
    expect(() => estimateMainSequenceRadius(200 * SOLAR_MASS_KILOGRAMS)).toThrow(
      PhysicsRangeError,
    );
  });
});

describe('computeEffectiveTemperature', () => {
  it('produces 5772 K for nominal solar luminosity and radius', () => {
    const result = computeEffectiveTemperature(
      NOMINAL_SOLAR_LUMINOSITY_L_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
    );
    expect(result).toBeCloseTo(5772, 0);
  });

  it('produces a solar effective temperature within 5% through the full mass pipeline', () => {
    // L(1 M☉) = 1 L☉ exactly; R(1 M☉) = 1.06 R☉ → T_eff ≈ 5606 K (−2.9%),
    // within the documented scatter of the empirical relations.
    const luminosity = estimateMainSequenceLuminosity(SOLAR_MASS_KILOGRAMS);
    const radius = estimateMainSequenceRadius(SOLAR_MASS_KILOGRAMS);
    const result = computeEffectiveTemperature(luminosity, radius);
    expect(Math.abs(result - 5772) / 5772).toBeLessThan(0.05);
  });

  it('produces ~3100 K for Proxima Centauri through the full mass pipeline (observed 3042 K)', () => {
    const massKilograms = 0.122 * SOLAR_MASS_KILOGRAMS;
    const result = computeEffectiveTemperature(
      estimateMainSequenceLuminosity(massKilograms),
      estimateMainSequenceRadius(massKilograms),
    );
    expect(Math.abs(result - 3042) / 3042).toBeLessThan(0.05);
  });

  it('scales as the fourth root of luminosity', () => {
    const base = computeEffectiveTemperature(NOMINAL_SOLAR_LUMINOSITY_L_SUN, NOMINAL_SOLAR_RADIUS_R_SUN);
    const brighter = computeEffectiveTemperature(
      16 * NOMINAL_SOLAR_LUMINOSITY_L_SUN,
      NOMINAL_SOLAR_RADIUS_R_SUN,
    );
    expect(brighter).toBeCloseTo(2 * base, 6);
  });

  it('throws PhysicsRangeError for zero luminosity', () => {
    expect(() => computeEffectiveTemperature(0, NOMINAL_SOLAR_RADIUS_R_SUN)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError for non-finite radius', () => {
    expect(() => computeEffectiveTemperature(NOMINAL_SOLAR_LUMINOSITY_L_SUN, Infinity)).toThrow(
      PhysicsRangeError,
    );
  });
});
