/**
 * @module types/configuration
 *
 * Input parameter types for the Planet Configuration System: the typed,
 * unit-suffixed contract through which all user parameters enter the
 * physics engine (ARCHITECTURE.md §3.1–3.2, CLAUDE.md §16 MVP scope).
 *
 * Inputs use the domain units of the ARCHITECTURE.md §3.2 I/O contract
 * (Earth masses, AU, hours, degrees); all computed state is SI
 * (see types/physics.ts).
 */

/** Main-sequence spectral classes accepted by the MVP (Morgan–Keenan system). */
export const SPECTRAL_CLASSES = ['O', 'B', 'A', 'F', 'G', 'K', 'M'] as const;
export type SpectralClass = (typeof SPECTRAL_CLASSES)[number];

/** Atmospheric gas species modeled in the MVP. */
export const ATMOSPHERIC_GASES = ['N2', 'O2', 'CO2', 'H2O', 'CH4', 'H2', 'He', 'Ar'] as const;
export type AtmosphericGas = (typeof ATMOSPHERIC_GASES)[number];

/** Bulk composition classes for the MVP planetary model. */
export const PLANET_COMPOSITION_CLASSES = [
  'rocky-silicate',
  'iron-rich',
  'water-world',
  'gas-dwarf',
] as const;
export type PlanetCompositionClass = (typeof PLANET_COMPOSITION_CLASSES)[number];

export interface StellarInputParameters {
  /** Morgan–Keenan spectral class of the host star (main sequence assumed). */
  spectralClass: SpectralClass;
  /** Stellar mass in nominal solar masses. */
  massSolarMasses: number;
  /** Stellar age in gigayears (Gyr). */
  ageGigayears: number;
}

export interface OrbitalInputParameters {
  /** Semi-major axis in astronomical units. */
  semiMajorAxisAstronomicalUnits: number;
  /** Orbital eccentricity (dimensionless). MVP supports bound orbits: [0, 1). */
  eccentricity: number;
}

export interface PlanetaryInputParameters {
  /** Planet mass in nominal Earth masses. */
  massEarthMasses: number;
  /** Planet mean radius in nominal Earth (equatorial) radii. */
  radiusEarthRadii: number;
  /** Bulk composition class (informs albedo and surface modeling). */
  compositionClass: PlanetCompositionClass;
}

export interface RotationInputParameters {
  /**
   * Sidereal rotation period in hours. Negative values denote retrograde
   * rotation; zero is invalid (ARCHITECTURE.md §3.2).
   */
  rotationPeriodHours: number;
  /** Axial tilt (obliquity) in degrees, [0, 180]. */
  axialTiltDegrees: number;
}

export interface AtmosphereInputParameters {
  /**
   * Surface partial pressure of each gas in kilopascals. Total surface
   * pressure is the sum of all partial pressures (ARCHITECTURE.md §3.2);
   * an empty map describes an airless world.
   */
  partialPressuresKilopascals: Partial<Record<AtmosphericGas, number>>;
}

/** The complete set of user-supplied initial conditions for one world. */
export interface PlanetConfiguration {
  stellar: StellarInputParameters;
  orbital: OrbitalInputParameters;
  planetary: PlanetaryInputParameters;
  rotation: RotationInputParameters;
  atmosphere: AtmosphereInputParameters;
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

/**
 * A user-facing diagnostic produced when input validation or a physics
 * calculation rejects or questions a parameter combination (CLAUDE.md §19).
 * Diagnostics never crash the UI; the store surfaces them.
 */
export interface SimulationDiagnostic {
  severity: DiagnosticSeverity;
  /** Dotted path of the offending parameter, e.g. "orbital.eccentricity". */
  parameter: string;
  /** What is wrong, including the offending value and the requirement. */
  message: string;
  /** Human-readable explanation of why this is physically problematic. */
  explanation: string;
}

/**
 * The validated genesis record of a simulation run (ARCHITECTURE.md §3.1):
 * a configuration that passed validation, bound to the schema version and
 * a deterministic content hash that serves as the world's identity.
 */
export interface ConfigurationManifest {
  /** PlanetaryState schema version this manifest was created under. */
  schemaVersion: string;
  /** The validated configuration, exactly as supplied. */
  configuration: PlanetConfiguration;
  /** SHA-256 hex digest of the schema version and canonicalized configuration. */
  hash: string;
}
