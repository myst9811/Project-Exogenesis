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

import type { AtmosphericGas, PlanetConfiguration } from './configuration';

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

/** Thermal escape outlook classification for one gas (Jeans criterion). */
export type JeansRetentionClassification = 'retained' | 'losing' | 'escaping';

/** Thermal escape outlook for one atmospheric gas. */
export interface GasRetentionResult {
  gas: AtmosphericGas;
  /** Dimensionless Jeans escape parameter λ at the evaluation temperature. */
  jeansParameter: number;
  classification: JeansRetentionClassification;
}

/** Computed surface-level atmospheric properties. */
export interface AtmosphericState {
  /** Sum of all gas partial pressures at the surface. */
  surfacePressureKilopascals: number;
  /** Pressure-weighted mean molar mass; null for an airless world. */
  meanMolarMassKilogramsPerMole: number | null;
  /** Isothermal scale height; null for an airless world. */
  scaleHeightMeters: number | null;
  /** Jeans escape outlook per present gas. */
  gasRetention: GasRetentionResult[];
}

/** Computed energy-budget properties. */
export interface ClimateState {
  /** Bond albedo estimated from the bulk composition class. */
  bondAlbedo: number;
  /** Equilibrium (blackbody) surface temperature — no greenhouse forcing. */
  equilibriumTemperatureKelvin: number;
  /** Gray longwave optical depth of the atmosphere. */
  greenhouseOpticalDepth: number;
  /** Greenhouse-adjusted surface temperature. */
  surfaceTemperatureKelvin: number;
}

/** Planet position relative to the habitable zone. */
export type HabitableZonePosition =
  | 'too-hot'
  | 'inside-optimistic'
  | 'inside-conservative'
  | 'too-cold';

/**
 * Computed habitable-zone geometry (Kopparapu parameterization) and the
 * planet's position within it.
 */
export interface HabitableZoneState {
  /** Runaway greenhouse limit — inner edge of the conservative zone. */
  conservativeInnerEdgeMeters: number;
  /** Maximum greenhouse limit — outer edge of the conservative zone. */
  conservativeOuterEdgeMeters: number;
  /** Recent Venus limit — inner edge of the optimistic zone. */
  optimisticInnerEdgeMeters: number;
  /** Early Mars limit — outer edge of the optimistic zone. */
  optimisticOuterEdgeMeters: number;
  position: HabitableZonePosition;
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
  /**
   * Null when the stellar effective temperature exceeds the 7200 K upper
   * domain bound of the Kopparapu parameterization. (The 2600 K lower
   * bound is unreachable: the main-sequence relations floor T_eff near
   * 2980 K at the minimum stellar mass admitted by validation.)
   */
  habitableZone: HabitableZoneState | null;
}
