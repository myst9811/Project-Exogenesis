/**
 * @module physics/atmosphere/index.test
 */

import { describe, expect, it } from 'vitest';

import { PhysicsRangeError } from '../errors';
import {
  computeJeansParameter,
  computeMeanMolarMass,
  computeScaleHeight,
  computeTotalSurfacePressure,
  estimateAtmosphericRetention,
} from './index';

/** Earth dry-air surface partial pressures, kPa (US Std Atmosphere × CRC fractions). */
const EARTH_DRY_AIR = { N2: 79.12, O2: 21.22, Ar: 0.95, CO2: 0.04 };

describe('computeTotalSurfacePressure', () => {
  it('produces ~101.3 kPa for the Earth dry-air mix', () => {
    expect(computeTotalSurfacePressure(EARTH_DRY_AIR)).toBeCloseTo(101.33, 2);
  });

  it('produces 0 for an airless world', () => {
    expect(computeTotalSurfacePressure({})).toBe(0);
  });

  it('throws PhysicsRangeError for a negative partial pressure', () => {
    expect(() => computeTotalSurfacePressure({ N2: -1 })).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for a non-finite partial pressure', () => {
    expect(() => computeTotalSurfacePressure({ O2: Number.NaN })).toThrow(PhysicsRangeError);
  });
});

describe('computeMeanMolarMass', () => {
  it('produces ~28.97 g/mol for Earth dry air', () => {
    expect(computeMeanMolarMass(EARTH_DRY_AIR) * 1000).toBeCloseTo(28.97, 1);
  });

  it('produces the pure-gas molar mass for a single-gas atmosphere', () => {
    expect(computeMeanMolarMass({ CO2: 9300 }) * 1000).toBeCloseTo(44.0095, 3);
  });

  it('throws PhysicsRangeError for an airless world (undefined mean)', () => {
    expect(() => computeMeanMolarMass({})).toThrow(PhysicsRangeError);
  });
});

describe('computeScaleHeight', () => {
  it('produces ~8.4 km for Earth (288 K, dry air, 9.81 m/s²)', () => {
    const result = computeScaleHeight(288, computeMeanMolarMass(EARTH_DRY_AIR), 9.81);
    expect(result / 1000).toBeCloseTo(8.4, 0);
  });

  it('produces ~10.7 km for Mars (210 K, pure CO₂, 3.71 m/s² — NASA fact sheet ~11.1 km)', () => {
    const result = computeScaleHeight(210, computeMeanMolarMass({ CO2: 0.6 }), 3.71);
    expect(result / 1000).toBeGreaterThan(10);
    expect(result / 1000).toBeLessThan(11.5);
  });

  it('throws PhysicsRangeError for non-positive temperature', () => {
    expect(() => computeScaleHeight(0, 0.029, 9.81)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for non-positive molar mass', () => {
    expect(() => computeScaleHeight(288, -0.01, 9.81)).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for non-finite gravity', () => {
    expect(() => computeScaleHeight(288, 0.029, Infinity)).toThrow(PhysicsRangeError);
  });
});

describe('computeJeansParameter', () => {
  it('produces λ ≈ 732 for N₂ on Earth (11,186 m/s, 288 K) — firmly retained', () => {
    expect(computeJeansParameter(11_186, 288, 'N2')).toBeCloseTo(732, 0);
  });

  it('produces λ ≈ 53 for H₂ on Earth — marginal, consistent with Earth losing hydrogen', () => {
    expect(computeJeansParameter(11_186, 288, 'H2')).toBeCloseTo(52.7, 0);
  });

  it('throws PhysicsRangeError for non-positive escape velocity', () => {
    expect(() => computeJeansParameter(0, 288, 'N2')).toThrow(PhysicsRangeError);
  });

  it('throws PhysicsRangeError for non-finite temperature', () => {
    expect(() => computeJeansParameter(11_186, Number.NaN, 'N2')).toThrow(PhysicsRangeError);
  });
});

describe('estimateAtmosphericRetention', () => {
  it('classifies Earth N₂/O₂ as retained and H₂ as losing', () => {
    const results = estimateAtmosphericRetention(11_186, 288, { N2: 79, O2: 21, H2: 0.001 });
    expect(results).toEqual([
      { gas: 'N2', jeansParameter: expect.any(Number) as number, classification: 'retained' },
      { gas: 'O2', jeansParameter: expect.any(Number) as number, classification: 'retained' },
      { gas: 'H2', jeansParameter: expect.any(Number) as number, classification: 'losing' },
    ]);
  });

  it('classifies N₂ on a Moon-like body (2,376 m/s, 390 K) as losing — consistent with an airless Moon', () => {
    const [nitrogen] = estimateAtmosphericRetention(2376, 390, { N2: 10 });
    expect(nitrogen?.classification).toBe('losing');
  });

  it('classifies H₂ on a Moon-like body as escaping', () => {
    const [hydrogen] = estimateAtmosphericRetention(2376, 390, { H2: 10 });
    expect(hydrogen?.classification).toBe('escaping');
  });

  it('skips gases with zero partial pressure', () => {
    const results = estimateAtmosphericRetention(11_186, 288, { N2: 79, O2: 0 });
    expect(results.map((r) => r.gas)).toEqual(['N2']);
  });

  it('returns an empty list for an airless world', () => {
    expect(estimateAtmosphericRetention(11_186, 288, {})).toEqual([]);
  });
});
