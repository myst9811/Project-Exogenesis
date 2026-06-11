/**
 * @module store/simulation
 *
 * The active simulation store: the single place the UI submits parameter
 * changes and the single place computed `PlanetaryState` is published
 * (CLAUDE.md §3–§4). Consumers read state read-only via the underlying
 * pub/sub store; they never compute physics themselves.
 *
 * Flow per change: validate the configuration (collecting all diagnostics,
 * warnings included), and if there are no errors, hash it into a manifest,
 * compute the immutable `PlanetaryState`, and assess habitability. Physics
 * exceptions are caught and surfaced as diagnostics — they never escape to
 * the UI (CLAUDE.md §19). The recompute is async (SHA-256), so stale
 * results from superseded changes are dropped.
 */

import type {
  ConfigurationManifest,
  PlanetConfiguration,
  SimulationDiagnostic,
} from '../types/configuration';
import type { HabitabilityAssessment } from '../types/habitability';
import type { PlanetaryState } from '../types/physics';
import { assessHabitability } from '../physics/habitability';
import { hashConfiguration } from '../physics/configuration/manifest';
import { validatePlanetConfiguration } from '../physics/configuration/validation';
import { computePlanetaryState } from '../physics';
import { createStore, type Store } from './createStore';

/** Lifecycle status of the most recent configuration submission. */
export type SimulationStatus = 'idle' | 'computing' | 'ready' | 'invalid' | 'error';

/** The published simulation state. All fields are read-only to consumers. */
export interface SimulationState {
  /** The most recently submitted configuration (valid or not). */
  configuration: PlanetConfiguration | null;
  /** Manifest of the last successfully computed world. */
  manifest: ConfigurationManifest | null;
  /** The last successfully computed state; retained across failed edits. */
  planetaryState: PlanetaryState | null;
  /** Habitability assessment of the last successfully computed state. */
  habitability: HabitabilityAssessment | null;
  /** Diagnostics from the most recent submission (errors and warnings). */
  diagnostics: readonly SimulationDiagnostic[];
  status: SimulationStatus;
}

const INITIAL_STATE: SimulationState = {
  configuration: null,
  manifest: null,
  planetaryState: null,
  habitability: null,
  diagnostics: [],
  status: 'idle',
};

/** The fully computed result of one valid configuration. */
export interface ComputedWorld {
  manifest: ConfigurationManifest;
  planetaryState: PlanetaryState;
  habitability: HabitabilityAssessment;
}

/**
 * The default compute pipeline: hash the validated configuration, compute
 * its immutable state, and assess habitability.
 */
async function computeWorldDefault(configuration: PlanetConfiguration): Promise<ComputedWorld> {
  const manifest = await hashConfiguration(configuration);
  const planetaryState = computePlanetaryState(manifest);
  return { manifest, planetaryState, habitability: assessHabitability(planetaryState) };
}

/** Construction options. The compute seam exists to test the §19 error path. */
export interface SimulationStoreOptions {
  /** Starting state (defaults to idle/empty). */
  initialState?: SimulationState;
  /** Override the compute pipeline; defaults to the real physics engine. */
  computeWorld?: (configuration: PlanetConfiguration) => Promise<ComputedWorld>;
}

/** The simulation store: a pub/sub store plus the typed input action. */
export interface SimulationStore extends Store<SimulationState> {
  /**
   * Submits a complete configuration, recomputes the world, and publishes
   * the result. Never rejects: failures become diagnostics in the state.
   * Concurrent calls are serialized by recency — only the latest result is
   * published.
   */
  applyConfiguration: (configuration: PlanetConfiguration) => Promise<void>;
}

/**
 * Creates a simulation store. Production callers pass no arguments and seed
 * via {@link SimulationStore.applyConfiguration}.
 *
 * @param options - Optional starting state and compute-pipeline override
 * @returns A {@link SimulationStore}
 */
export function createSimulationStore(options: SimulationStoreOptions = {}): SimulationStore {
  const computeWorld = options.computeWorld ?? computeWorldDefault;
  const store = createStore<SimulationState>(options.initialState ?? INITIAL_STATE);

  // Monotonic token so a slow recompute superseded by a newer submission
  // does not overwrite the newer result.
  let latestRequest = 0;

  const applyConfiguration = async (configuration: PlanetConfiguration): Promise<void> => {
    const request = ++latestRequest;
    const validation = validatePlanetConfiguration(configuration);

    if (!validation.valid) {
      if (request === latestRequest) {
        store.setState((previous) => ({
          ...previous,
          configuration,
          diagnostics: validation.diagnostics,
          status: 'invalid',
        }));
      }
      return;
    }

    store.setState((previous) => ({
      ...previous,
      configuration,
      diagnostics: validation.diagnostics,
      status: 'computing',
    }));

    try {
      const { manifest, planetaryState, habitability } = await computeWorld(configuration);
      if (request !== latestRequest) {
        return;
      }
      store.setState((previous) => ({
        ...previous,
        configuration,
        manifest,
        planetaryState,
        habitability,
        diagnostics: validation.diagnostics,
        status: 'ready',
      }));
    } catch (error) {
      if (request !== latestRequest) {
        return;
      }
      store.setState((previous) => ({
        ...previous,
        configuration,
        status: 'error',
        diagnostics: [
          ...validation.diagnostics,
          {
            severity: 'error',
            parameter: 'physics',
            message: error instanceof Error ? error.message : 'Unknown physics error.',
            explanation:
              'The physics engine rejected this configuration after validation. ' +
              'This indicates a parameter combination outside a model’s domain.',
          },
        ],
      }));
    }
  };

  return { ...store, applyConfiguration };
}
