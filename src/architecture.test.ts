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
import * as rendererSurface from './renderer/surface';
import * as rendererAtmosphere from './renderer/atmosphere';
import * as rendererStar from './renderer/star';
import * as rendererShaderUniforms from './renderer/shaderUniforms';
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
  // Renderer organized as a pure derivation layer (ADR-006); the §3
  // subsystems map to these modules (planet→surface, atmosphere, stellar
  // disk→star) plus the Three.js scene, which needs WebGL and is not
  // import-smoke-tested here.
  'renderer/surface': rendererSurface,
  'renderer/atmosphere': rendererAtmosphere,
  'renderer/star': rendererStar,
  'renderer/shaderUniforms': rendererShaderUniforms,
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
