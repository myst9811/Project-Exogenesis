/**
 * @module types/physics
 *
 * The versioned `PlanetaryState` schema: the single immutable output
 * contract of the physics engine. Every downstream consumer (renderer,
 * translation, AI) reads this shape and nothing else (CLAUDE.md §3).
 *
 * All computed values are SI; inputs keep their domain units inside the
 * echoed `PlanetConfiguration` (see types/configuration.ts).
 */

import type { PlanetConfiguration } from './configuration';

/**
 * Schema version of `PlanetaryState`. Increment on any breaking change;
 * shared world URLs embed this version and are migrated forward
 * (CLAUDE.md §16). Pre-1.0: the schema is still gaining fields as the
 * MVP physics modules land.
 */
export const PLANETARY_STATE_SCHEMA_VERSION = '0.1.0';

/** Computed properties of the host star. */
export interface StellarState {
  massKilograms: number;
  luminosityWatts: number;
  radiusMeters: number;
  effectiveTemperatureKelvin: number;
}

/** Computed orbital properties of the planet. */
export interface OrbitalState {
  semiMajorAxisMeters: number;
  orbitalPeriodSeconds: number;
  /** Dimensionless. */
  eccentricity: number;
}

/** Computed bulk physical properties of the planet. */
export interface PlanetaryBulkState {
  massKilograms: number;
  radiusMeters: number;
  bulkDensityKilogramsPerCubicMeter: number;
  surfaceGravityMetersPerSecondSquared: number;
  escapeVelocityMetersPerSecond: number;
}

/** Computed surface-level atmospheric properties. */
export interface AtmosphericState {
  /** Sum of all gas partial pressures at the surface. */
  surfacePressureKilopascals: number;
}

/** Computed energy-budget properties. */
export interface ClimateState {
  /**
   * Equilibrium (blackbody) surface temperature — no greenhouse forcing.
   * Greenhouse-adjusted temperature is added when the climate module lands.
   */
  equilibriumTemperatureKelvin: number;
}

/** Computed habitable-zone geometry for the host star. */
export interface HabitableZoneState {
  innerEdgeMeters: number;
  outerEdgeMeters: number;
}

/**
 * The complete computed state of one simulated world. Produced exclusively
 * by the physics engine; treated as deeply immutable at every boundary.
 */
export interface PlanetaryState {
  /** Schema version this object conforms to. */
  schemaVersion: string;
  /** Hash of the ConfigurationManifest this state was computed from. */
  configurationHash: string;
  /** The validated inputs this state derives from, echoed verbatim. */
  configuration: PlanetConfiguration;
  stellar: StellarState;
  orbit: OrbitalState;
  bulk: PlanetaryBulkState;
  atmosphere: AtmosphericState;
  climate: ClimateState;
  habitableZone: HabitableZoneState;
}
