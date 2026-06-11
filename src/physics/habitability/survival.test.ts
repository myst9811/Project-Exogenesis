/**
 * @module physics/habitability/survival.test
 */

import { describe, expect, it } from 'vitest';

import type { PlanetConfiguration } from '../../types/configuration';
import type { SurvivalFactor, SurvivalFactorId } from '../../types/habitability';
import type { PlanetaryState } from '../../types/physics';
import { createEarthBaselineConfiguration } from '../configuration/earthBaseline';
import { buildConfigurationManifest } from '../configuration/manifest';
import { computePlanetaryState } from '../index';
import { assessHabitability, assessHumanBaselineSurvival } from './survival';

async function stateFor(
  mutate: (configuration: PlanetConfiguration) => void = () => undefined,
): Promise<PlanetaryState> {
  const configuration = createEarthBaselineConfiguration();
  mutate(configuration);
  const result = await buildConfigurationManifest(configuration);
  if (!result.ok) {
    throw new Error('test fixture configuration failed validation');
  }
  return computePlanetaryState(result.manifest);
}

function factor(assessmentFactors: readonly SurvivalFactor[], id: SurvivalFactorId): SurvivalFactor {
  const found = assessmentFactors.find((entry) => entry.factor === id);
  if (found === undefined) {
    throw new Error(`missing factor ${id}`);
  }
  return found;
}

describe('assessHumanBaselineSurvival', () => {
  it('rates Earth as optimal across every factor with a near-perfect score', async () => {
    const survival = assessHumanBaselineSurvival(await stateFor());
    expect(survival.model).toBe('human-baseline');
    expect(survival.survivabilityScore).toBeGreaterThan(99);
    expect(survival.status).toBe('optimal');
    for (const entry of survival.factors) {
      expect(entry.status).toBe('optimal');
      expect(entry.score).toBeCloseTo(1, 5);
    }
  });

  it('reports the five factors in fixed order', async () => {
    const survival = assessHumanBaselineSurvival(await stateFor());
    expect(survival.factors.map((entry) => entry.factor)).toEqual([
      'thermal',
      'pressure',
      'oxygen',
      'carbon-dioxide',
      'gravity',
    ]);
  });

  it('labels gravity as speculative and the others as estimated', async () => {
    const survival = assessHumanBaselineSurvival(await stateFor());
    expect(factor(survival.factors, 'gravity').confidence).toBe('speculative');
    expect(factor(survival.factors, 'thermal').confidence).toBe('estimated');
    expect(factor(survival.factors, 'oxygen').confidence).toBe('estimated');
  });

  it('drives the score to zero and status to lethal when any axis is lethal', async () => {
    // No oxygen: the oxygen factor is lethal, so the product is zero.
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        delete c.atmosphere.partialPressuresKilopascals.O2;
      }),
    );
    expect(survival.survivabilityScore).toBe(0);
    expect(survival.status).toBe('lethal');
    expect(survival.limitingFactor).toBe('oxygen');
    expect(factor(survival.factors, 'oxygen').status).toBe('lethal');
  });

  it('names thermal as the limiting factor on a hot world', async () => {
    // Move inward: high equilibrium temperature makes thermal the worst axis.
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.orbital.semiMajorAxisAstronomicalUnits = 0.5;
      }),
    );
    expect(survival.limitingFactor).toBe('thermal');
    expect(factor(survival.factors, 'thermal').score).toBeLessThan(1);
  });

  it('reports the limiting factor confidence as the overall confidence', async () => {
    // A low-gravity world makes the speculative gravity axis the limiter.
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.planetary.massEarthMasses = 0.1;
        c.planetary.radiusEarthRadii = 0.5;
      }),
    );
    expect(survival.limitingFactor).toBe('gravity');
    expect(survival.overallConfidence).toBe('speculative');
  });

  it('rates a mildly suboptimal single axis as tolerable, not optimal', async () => {
    // Thin-but-survivable total pressure: tolerable pressure, others optimal.
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.atmosphere.partialPressuresKilopascals = { N2: 20, O2: 20 };
      }),
    );
    const pressure = factor(survival.factors, 'pressure');
    expect(pressure.status).toBe('tolerable');
    expect(pressure.score).toBeGreaterThan(0.5);
    expect(pressure.score).toBeLessThan(1);
  });

  it('rates a strongly suboptimal single axis as hostile', async () => {
    // Just above the Armstrong limit: pressure is hostile but not lethal.
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.atmosphere.partialPressuresKilopascals = { N2: 5, O2: 5 };
      }),
    );
    const pressure = factor(survival.factors, 'pressure');
    expect(pressure.status).toBe('hostile');
    expect(pressure.score).toBeGreaterThan(0);
    expect(pressure.score).toBeLessThan(0.5);
  });

  it('scores intermediate carbon-dioxide between the tolerable and lethal ceilings', async () => {
    // 2 kPa CO₂ sits between the 0.7 kPa optimal ceiling and 7 kPa lethal
    // limit, so the toxicity factor takes an intermediate score. (CO₂ is
    // also a greenhouse gas, so this world warms — thermal may bind first;
    // here we exercise only the carbon-dioxide factor's middle branch.)
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.atmosphere.partialPressuresKilopascals.CO2 = 2;
      }),
    );
    const carbonDioxide = factor(survival.factors, 'carbon-dioxide');
    expect(carbonDioxide.score).toBeGreaterThan(0);
    expect(carbonDioxide.score).toBeLessThan(1);
    expect(carbonDioxide.status).toBe('tolerable');
  });

  it('rates lethal carbon-dioxide (≥ 7 kPa) as a zero score', async () => {
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.atmosphere.partialPressuresKilopascals.CO2 = 10;
      }),
    );
    expect(factor(survival.factors, 'carbon-dioxide').status).toBe('lethal');
    expect(survival.survivabilityScore).toBe(0);
  });

  it('rates excess oxygen toward toxicity as suboptimal', async () => {
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.atmosphere.partialPressuresKilopascals.O2 = 70; // optimal ceiling 50, lethal 95
      }),
    );
    const oxygen = factor(survival.factors, 'oxygen');
    expect(oxygen.score).toBeGreaterThan(0);
    expect(oxygen.score).toBeLessThan(1);
  });

  it('rates a high-gravity world toward the survivable ceiling as suboptimal', async () => {
    const survival = assessHumanBaselineSurvival(
      await stateFor((c) => {
        c.planetary.massEarthMasses = 5;
        c.planetary.radiusEarthRadii = 1.5; // ~2.2 g
      }),
    );
    const gravity = factor(survival.factors, 'gravity');
    expect(gravity.score).toBeGreaterThan(0);
    expect(gravity.score).toBeLessThan(1);
  });
});

describe('assessHabitability', () => {
  it('bundles liquid water and one survival model for Earth', async () => {
    const assessment = assessHabitability(await stateFor());
    expect(assessment.liquidWater.possible).toBe(true);
    expect(assessment.survival).toHaveLength(1);
    expect(assessment.survival[0]?.model).toBe('human-baseline');
  });

  it('reports liquid water impossible on a frozen distant world', async () => {
    const assessment = assessHabitability(
      await stateFor((c) => {
        c.orbital.semiMajorAxisAstronomicalUnits = 5;
      }),
    );
    expect(assessment.liquidWater.possible).toBe(false);
  });
});
