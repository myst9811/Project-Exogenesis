/**
 * @module architecture.test
 *
 * Structural smoke test: verifies that every module in the CLAUDE.md §3
 * module map exists, compiles under strict TypeScript, and is importable.
 * Phase 0 exit criterion (ROADMAP.md).
 */

import { describe, expect, it } from 'vitest';

import * as physicsStellar from './physics/stellar';
import * as physicsOrbital from './physics/orbital';
import * as physicsPlanetary from './physics/planetary';
import * as physicsAtmosphere from './physics/atmosphere';
import * as physicsClimate from './physics/climate';
import * as physicsHabitability from './physics/habitability';
import * as rendererPlanet from './renderer/planet';
import * as rendererAtmosphere from './renderer/atmosphere';
import * as rendererSky from './renderer/sky';
import * as rendererSpace from './renderer/space';
import * as ai from './ai';
import * as aiPrompts from './ai/prompts';
import * as translation from './translation';
import * as store from './store';
import * as ui from './ui';
import * as types from './types';

const moduleMap = {
  'physics/stellar': physicsStellar,
  'physics/orbital': physicsOrbital,
  'physics/planetary': physicsPlanetary,
  'physics/atmosphere': physicsAtmosphere,
  'physics/climate': physicsClimate,
  'physics/habitability': physicsHabitability,
  'renderer/planet': rendererPlanet,
  'renderer/atmosphere': rendererAtmosphere,
  'renderer/sky': rendererSky,
  'renderer/space': rendererSpace,
  ai: ai,
  'ai/prompts': aiPrompts,
  translation: translation,
  store: store,
  ui: ui,
  types: types,
} as const;

describe('module map', () => {
  it.each(Object.keys(moduleMap))('resolves and loads module %s', (name) => {
    expect(moduleMap[name as keyof typeof moduleMap]).toBeDefined();
  });
});
