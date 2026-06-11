/**
 * @module physics/habitability/index.test
 */

import { describe, expect, it } from 'vitest';

import {
  ASTRONOMICAL_UNIT_AU,
  NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
  NOMINAL_SOLAR_LUMINOSITY_L_SUN,
} from '../constants';
import { PhysicsRangeError } from '../errors';
import { classifyHabitableZonePosition, computeHabitableZone } from './index';

const SOLAR_ZONE = computeHabitableZone(
  NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN,
  NOMINAL_SOLAR_LUMINOSITY_L_SUN,
);

describe('computeHabitableZone', () => {
  it('reproduces the published solar-system edges (0.75 / 0.95 / 1.68 / 1.77 AU)', () => {
    // Kopparapu et al. (2013 erratum; 2014): recent Venus 0.75 AU, runaway
    // greenhouse 0.95 AU, maximum greenhouse 1.67-1.69 AU, early Mars 1.77 AU.
    // T_eff = 5772 K differs slightly from the 5780 K reference.
    expect(SOLAR_ZONE.optimisticInnerEdgeMeters / ASTRONOMICAL_UNIT_AU).toBeCloseTo(0.75, 2);
    expect(SOLAR_ZONE.conservativeInnerEdgeMeters / ASTRONOMICAL_UNIT_AU).toBeCloseTo(0.95, 2);
    expect(SOLAR_ZONE.conservativeOuterEdgeMeters / ASTRONOMICAL_UNIT_AU).toBeCloseTo(1.68, 1);
    expect(SOLAR_ZONE.optimisticOuterEdgeMeters / ASTRONOMICAL_UNIT_AU).toBeCloseTo(1.77, 1);
  });

  it('places the conservative zone strictly inside the optimistic zone', () => {
    expect(SOLAR_ZONE.optimisticInnerEdgeMeters).toBeLessThan(
      SOLAR_ZONE.conservativeInnerEdgeMeters,
    );
    expect(SOLAR_ZONE.conservativeInnerEdgeMeters).toBeLessThan(
      SOLAR_ZONE.conservativeOuterEdgeMeters,
    );
    expect(SOLAR_ZONE.conservativeOuterEdgeMeters).toBeLessThan(
      SOLAR_ZONE.optimisticOuterEdgeMeters,
    );
  });

  it('moves the zone inward for a cooler star (Kepler-442: 4402 K, 0.117 L☉)', () => {
    // Torres et al. (2015), ApJ 800, 99: Kepler-442b (a = 0.409 AU) lies in
    // the habitable zone of its K-dwarf host.
    const zone = computeHabitableZone(4402, 0.117 * NOMINAL_SOLAR_LUMINOSITY_L_SUN);
    expect(zone.conservativeInnerEdgeMeters / ASTRONOMICAL_UNIT_AU).toBeCloseTo(0.35, 1);
    expect(zone.conservativeOuterEdgeMeters / ASTRONOMICAL_UNIT_AU).toBeCloseTo(0.65, 1);
  });

  it('throws PhysicsRangeError below the 2600 K parameterization domain', () => {
    expect(() => computeHabitableZone(2500, NOMINAL_SOLAR_LUMINOSITY_L_SUN)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError above the 7200 K parameterization domain', () => {
    expect(() => computeHabitableZone(8000, NOMINAL_SOLAR_LUMINOSITY_L_SUN)).toThrow(
      PhysicsRangeError,
    );
  });

  it('throws PhysicsRangeError for non-positive luminosity', () => {
    expect(() => computeHabitableZone(5772, 0)).toThrow(PhysicsRangeError);
  });
});

describe('classifyHabitableZonePosition', () => {
  it('classifies Earth (1 AU) as inside the conservative zone', () => {
    expect(classifyHabitableZonePosition(ASTRONOMICAL_UNIT_AU, SOLAR_ZONE)).toBe(
      'inside-conservative',
    );
  });

  it('classifies Kepler-442b (0.409 AU around its K dwarf) as inside the conservative zone', () => {
    const zone = computeHabitableZone(4402, 0.117 * NOMINAL_SOLAR_LUMINOSITY_L_SUN);
    expect(classifyHabitableZonePosition(0.409 * ASTRONOMICAL_UNIT_AU, zone)).toBe(
      'inside-conservative',
    );
  });

  it('classifies Venus (0.723 AU) as too hot even for the optimistic zone', () => {
    expect(classifyHabitableZonePosition(0.723 * ASTRONOMICAL_UNIT_AU, SOLAR_ZONE)).toBe(
      'too-hot',
    );
  });

  it('classifies 0.85 AU as inside the optimistic zone only (recent Venus annulus)', () => {
    expect(classifyHabitableZonePosition(0.85 * ASTRONOMICAL_UNIT_AU, SOLAR_ZONE)).toBe(
      'inside-optimistic',
    );
  });

  it('classifies 1.72 AU as inside the optimistic zone only (early Mars annulus)', () => {
    expect(classifyHabitableZonePosition(1.72 * ASTRONOMICAL_UNIT_AU, SOLAR_ZONE)).toBe(
      'inside-optimistic',
    );
  });

  it('classifies Jupiter (5.2 AU) as too cold', () => {
    expect(classifyHabitableZonePosition(5.2 * ASTRONOMICAL_UNIT_AU, SOLAR_ZONE)).toBe(
      'too-cold',
    );
  });

  it('throws PhysicsRangeError for a non-positive semi-major axis', () => {
    expect(() => classifyHabitableZonePosition(0, SOLAR_ZONE)).toThrow(PhysicsRangeError);
  });
});
