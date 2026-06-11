/**
 * @module store/simulation.test
 */

import { describe, expect, it, vi } from 'vitest';

import type { PlanetConfiguration } from '../types/configuration';
import { assessHabitability } from '../physics/habitability';
import { hashConfiguration } from '../physics/configuration/manifest';
import { computePlanetaryState } from '../physics';
import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import { type ComputedWorld, createSimulationStore } from './simulation';

/** Runs the real engine to produce a genuine ComputedWorld fixture. */
async function realWorld(configuration: PlanetConfiguration): Promise<ComputedWorld> {
  const manifest = await hashConfiguration(configuration);
  const planetaryState = computePlanetaryState(manifest);
  return { manifest, planetaryState, habitability: assessHabitability(planetaryState) };
}

describe('createSimulationStore', () => {
  it('starts idle and empty', () => {
    const store = createSimulationStore();
    expect(store.getState().status).toBe('idle');
    expect(store.getState().planetaryState).toBeNull();
  });

  it('computes and publishes a ready state for a valid configuration', async () => {
    const store = createSimulationStore();
    await store.applyConfiguration(createEarthBaselineConfiguration());
    const state = store.getState();
    expect(state.status).toBe('ready');
    expect(state.planetaryState).not.toBeNull();
    expect(state.habitability?.survival[0]?.model).toBe('human-baseline');
    expect(state.manifest?.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(state.diagnostics).toEqual([]);
  });

  it('notifies subscribers when a computation completes', async () => {
    const store = createSimulationStore();
    const listener = vi.fn();
    store.subscribe(listener);
    await store.applyConfiguration(createEarthBaselineConfiguration());
    expect(listener).toHaveBeenCalled();
  });

  it('marks an invalid configuration invalid with error diagnostics', async () => {
    const store = createSimulationStore();
    const invalid = createEarthBaselineConfiguration();
    invalid.planetary.massEarthMasses = 0;
    await store.applyConfiguration(invalid);
    const state = store.getState();
    expect(state.status).toBe('invalid');
    expect(state.diagnostics.some((d) => d.severity === 'error')).toBe(true);
    expect(state.planetaryState).toBeNull();
  });

  it('retains the last good state when a later edit is invalid', async () => {
    const store = createSimulationStore();
    await store.applyConfiguration(createEarthBaselineConfiguration());
    const good = store.getState().planetaryState;
    const invalid = createEarthBaselineConfiguration();
    invalid.orbital.eccentricity = 1; // unbound — invalid
    await store.applyConfiguration(invalid);
    expect(store.getState().status).toBe('invalid');
    expect(store.getState().planetaryState).toBe(good);
  });

  it('surfaces warnings as diagnostics on an otherwise valid configuration', async () => {
    const store = createSimulationStore();
    const warned = createEarthBaselineConfiguration();
    warned.stellar.massSolarMasses = 5; // B-class mass declared as G → warning
    await store.applyConfiguration(warned);
    const state = store.getState();
    expect(state.status).toBe('ready');
    expect(state.diagnostics.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('drops a stale result when a newer submission supersedes it', async () => {
    const earth = createEarthBaselineConfiguration();
    const denser = createEarthBaselineConfiguration();
    denser.planetary.massEarthMasses = 2;
    const [earthWorld, denserWorld] = await Promise.all([realWorld(earth), realWorld(denser)]);

    const pending: ((world: ComputedWorld) => void)[] = [];
    const store = createSimulationStore({
      computeWorld: () =>
        new Promise<ComputedWorld>((resolve) => {
          pending.push(resolve);
        }),
    });

    const first = store.applyConfiguration(earth);
    const second = store.applyConfiguration(denser);

    // Resolve the newest request first, then the stale one.
    pending[1]?.(denserWorld);
    await second;
    pending[0]?.(earthWorld);
    await first;

    expect(store.getState().planetaryState).toBe(denserWorld.planetaryState);
  });

  it('catches a physics failure after validation and reports an error diagnostic', async () => {
    const store = createSimulationStore({
      computeWorld: () => Promise.reject(new Error('domain exceeded')),
    });
    await store.applyConfiguration(createEarthBaselineConfiguration());
    const state = store.getState();
    expect(state.status).toBe('error');
    const physicsDiagnostic = state.diagnostics.find((d) => d.parameter === 'physics');
    expect(physicsDiagnostic?.message).toContain('domain exceeded');
  });

  it('reports a generic message when a non-Error value is thrown', async () => {
    const store = createSimulationStore({
      // Deliberately reject with a non-Error to exercise the fallback branch.
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      computeWorld: () => Promise.reject('boom'),
    });
    await store.applyConfiguration(createEarthBaselineConfiguration());
    expect(store.getState().diagnostics.find((d) => d.parameter === 'physics')?.message).toBe(
      'Unknown physics error.',
    );
  });

  it('passes through a computing status before resolving', async () => {
    const pending: ((world: ComputedWorld) => void)[] = [];
    const store = createSimulationStore({
      computeWorld: () =>
        new Promise<ComputedWorld>((resolve) => {
          pending.push(resolve);
        }),
    });
    const earth = createEarthBaselineConfiguration();
    const done = store.applyConfiguration(earth);
    expect(store.getState().status).toBe('computing');
    pending[0]?.(await realWorld(earth));
    await done;
    expect(store.getState().status).toBe('ready');
  });
});
