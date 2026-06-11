/**
 * @module physics
 *
 * Engine orchestrator: assembles a complete, immutable `PlanetaryState`
 * from a validated `ConfigurationManifest`.
 *
 * This is the single producer of `PlanetaryState` in the system
 * (ADR-001). Taking a manifest rather than a raw configuration encodes
 * at the type level that inputs have passed the validation gateway.
 *
 * Pipeline: stellar properties → orbit → planetary bulk → energy budget
 * → atmospheric structure and retention → habitable zone. Every value is
 * computed by the domain modules; nothing is authored here.
 */

import type { ConfigurationManifest } from '../types/configuration';
import type { HabitableZoneState, PlanetaryState } from '../types/physics';
import { PLANETARY_STATE_SCHEMA_VERSION } from '../types/physics';
import {
  computeMeanMolarMass,
  computeScaleHeight,
  computeTotalSurfacePressure,
  estimateAtmosphericRetention,
} from './atmosphere';
import {
  computeEquilibriumTemperature,
  computeGreenhouseSurfaceTemperature,
  estimateBondAlbedo,
  estimateGreenhouseOpticalDepth,
} from './climate';
import {
  ASTRONOMICAL_UNIT_AU,
  EARTH_EQUATORIAL_RADIUS_METERS,
  EARTH_MASS_KILOGRAMS,
  SOLAR_MASS_KILOGRAMS,
} from './constants';
import {
  classifyHabitableZonePosition,
  computeHabitableZone,
  KOPPARAPU_MAXIMUM_TEFF_KELVIN,
} from './habitability';
import { computeOrbitalPeriod } from './orbital';
import {
  computeBulkDensity,
  computeEscapeVelocity,
  computeSurfaceGravity,
} from './planetary';
import {
  computeEffectiveTemperature,
  estimateMainSequenceLuminosity,
  estimateMainSequenceRadius,
} from './stellar';

/**
 * Computes the complete planetary state for a validated configuration.
 *
 * The returned object and all of its branches are frozen: `PlanetaryState`
 * is immutable at every boundary (CLAUDE.md §3). A new state is produced
 * on every call; nothing is mutated in place.
 *
 * @param manifest - Validated configuration manifest (the world's identity)
 * @returns The immutable computed state of the world
 */
export function computePlanetaryState(manifest: ConfigurationManifest): PlanetaryState {
  const { configuration } = manifest;

  // Stellar properties from mass (spectral class is cosmetic; see validation).
  const stellarMassKilograms = configuration.stellar.massSolarMasses * SOLAR_MASS_KILOGRAMS;
  const luminosityWatts = estimateMainSequenceLuminosity(stellarMassKilograms);
  const stellarRadiusMeters = estimateMainSequenceRadius(stellarMassKilograms);
  const effectiveTemperatureKelvin = computeEffectiveTemperature(
    luminosityWatts,
    stellarRadiusMeters,
  );

  // Orbit.
  const semiMajorAxisMeters =
    configuration.orbital.semiMajorAxisAstronomicalUnits * ASTRONOMICAL_UNIT_AU;
  const orbitalPeriodSeconds = computeOrbitalPeriod(semiMajorAxisMeters, stellarMassKilograms);

  // Planetary bulk.
  const massKilograms = configuration.planetary.massEarthMasses * EARTH_MASS_KILOGRAMS;
  const radiusMeters = configuration.planetary.radiusEarthRadii * EARTH_EQUATORIAL_RADIUS_METERS;
  const bulkDensityKilogramsPerCubicMeter = computeBulkDensity(massKilograms, radiusMeters);
  const surfaceGravityMetersPerSecondSquared = computeSurfaceGravity(massKilograms, radiusMeters);
  const escapeVelocityMetersPerSecond = computeEscapeVelocity(massKilograms, radiusMeters);

  // Energy budget.
  const partialPressuresKilopascals = configuration.atmosphere.partialPressuresKilopascals;
  const bondAlbedo = estimateBondAlbedo(configuration.planetary.compositionClass);
  const equilibriumTemperatureKelvin = computeEquilibriumTemperature(
    effectiveTemperatureKelvin,
    stellarRadiusMeters,
    semiMajorAxisMeters,
    bondAlbedo,
  );
  const greenhouseOpticalDepth = estimateGreenhouseOpticalDepth(partialPressuresKilopascals);
  const surfaceTemperatureKelvin = computeGreenhouseSurfaceTemperature(
    equilibriumTemperatureKelvin,
    greenhouseOpticalDepth,
  );

  // Atmospheric structure and thermal escape.
  const surfacePressureKilopascals = computeTotalSurfacePressure(partialPressuresKilopascals);
  let meanMolarMassKilogramsPerMole: number | null = null;
  let scaleHeightMeters: number | null = null;
  if (surfacePressureKilopascals > 0) {
    meanMolarMassKilogramsPerMole = computeMeanMolarMass(partialPressuresKilopascals);
    scaleHeightMeters = computeScaleHeight(
      surfaceTemperatureKelvin,
      meanMolarMassKilogramsPerMole,
      surfaceGravityMetersPerSecondSquared,
    );
  }
  const gasRetention = estimateAtmosphericRetention(
    escapeVelocityMetersPerSecond,
    surfaceTemperatureKelvin,
    partialPressuresKilopascals,
  );

  // Habitable zone. Only the upper Kopparapu domain bound is reachable:
  // the main-sequence relations floor T_eff near 2980 K at the minimum
  // stellar mass admitted by validation, above the 2600 K lower bound.
  let habitableZone: HabitableZoneState | null = null;
  if (effectiveTemperatureKelvin <= KOPPARAPU_MAXIMUM_TEFF_KELVIN) {
    const zone = computeHabitableZone(effectiveTemperatureKelvin, luminosityWatts);
    habitableZone = Object.freeze({
      ...zone,
      position: classifyHabitableZonePosition(semiMajorAxisMeters, zone),
    });
  }

  return Object.freeze({
    schemaVersion: PLANETARY_STATE_SCHEMA_VERSION,
    configurationHash: manifest.hash,
    configuration,
    stellar: Object.freeze({
      massKilograms: stellarMassKilograms,
      luminosityWatts,
      radiusMeters: stellarRadiusMeters,
      effectiveTemperatureKelvin,
    }),
    orbit: Object.freeze({
      semiMajorAxisMeters,
      orbitalPeriodSeconds,
      eccentricity: configuration.orbital.eccentricity,
    }),
    bulk: Object.freeze({
      massKilograms,
      radiusMeters,
      bulkDensityKilogramsPerCubicMeter,
      surfaceGravityMetersPerSecondSquared,
      escapeVelocityMetersPerSecond,
    }),
    atmosphere: Object.freeze({
      surfacePressureKilopascals,
      meanMolarMassKilogramsPerMole,
      scaleHeightMeters,
      gasRetention: Object.freeze(gasRetention.map((entry) => Object.freeze(entry))),
    }),
    climate: Object.freeze({
      bondAlbedo,
      equilibriumTemperatureKelvin,
      greenhouseOpticalDepth,
      surfaceTemperatureKelvin,
    }),
    habitableZone,
  });
}
