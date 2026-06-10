/**
 * @module physics/configuration/validation
 *
 * Input validation for the Planet Configuration System (ARCHITECTURE.md
 * §3.1): range bounding, runtime type checks, and relational consistency
 * checks over a `PlanetConfiguration`. This module is the ingestion
 * gateway — configurations may arrive from deserialized JSON, so enum
 * membership and value types are verified at runtime, not just by the
 * compiler.
 *
 * Validation collects every problem it finds rather than failing fast:
 * physically impossible values are `error` severity (the configuration is
 * rejected), physically suspect ones are `warning` severity (the
 * configuration proceeds, flagged). Conservative per CLAUDE.md §6.
 */

import {
  ATMOSPHERIC_GASES,
  PLANET_COMPOSITION_CLASSES,
  SPECTRAL_CLASSES,
} from '../../types/configuration';
import type {
  AtmosphereInputParameters,
  OrbitalInputParameters,
  PlanetaryInputParameters,
  PlanetConfiguration,
  RotationInputParameters,
  SimulationDiagnostic,
  StellarInputParameters,
} from '../../types/configuration';
import {
  EARTH_EQUATORIAL_RADIUS_METERS,
  EARTH_MASS_KILOGRAMS,
  HYDROGEN_BURNING_MINIMUM_MASS_SOLAR_MASSES,
  MAXIMUM_BOUND_ORBIT_SEMI_MAJOR_AXIS_AU,
  MAXIMUM_MODELED_SURFACE_PRESSURE_KILOPASCALS,
  MAXIMUM_PLANET_MASS_EARTH_MASSES,
  MAXIMUM_PLANET_RADIUS_EARTH_RADII,
  MAXIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER,
  MAXIMUM_STELLAR_MASS_SOLAR_MASSES,
  MINIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER,
  SPECTRAL_CLASS_MASS_RANGE_SOLAR_MASSES,
  UNIVERSE_AGE_GIGAYEARS,
} from '../constants';
import { computeBulkDensity } from '../planetary';

export interface ConfigurationValidationResult {
  /** True when no error-severity diagnostics were produced. */
  valid: boolean;
  diagnostics: SimulationDiagnostic[];
}

interface RangeCheck {
  parameter: string;
  value: number;
  unit: string;
  minimum: number;
  maximum: number;
  minimumExclusive?: boolean;
  maximumExclusive?: boolean;
  explanation: string;
}

/** Range-checks a value; non-finite values always fail. Returns true if valid. */
function checkRange(diagnostics: SimulationDiagnostic[], check: RangeCheck): boolean {
  const aboveMinimum =
    check.minimumExclusive === true ? check.value > check.minimum : check.value >= check.minimum;
  const belowMaximum =
    check.maximumExclusive === true ? check.value < check.maximum : check.value <= check.maximum;
  if (Number.isFinite(check.value) && aboveMinimum && belowMaximum) {
    return true;
  }
  const lowerBracket = check.minimumExclusive === true ? '(' : '[';
  const upperBracket = check.maximumExclusive === true ? ')' : ']';
  diagnostics.push({
    severity: 'error',
    parameter: check.parameter,
    message:
      `${check.parameter} = ${check.value} ${check.unit} is outside the valid range ` +
      `${lowerBracket}${check.minimum}, ${check.maximum}${upperBracket} ${check.unit}`,
    explanation: check.explanation,
  });
  return false;
}

function validateStellar(stellar: StellarInputParameters, diagnostics: SimulationDiagnostic[]): void {
  const classKnown = SPECTRAL_CLASSES.includes(stellar.spectralClass);
  if (!classKnown) {
    diagnostics.push({
      severity: 'error',
      parameter: 'stellar.spectralClass',
      message: `stellar.spectralClass = "${stellar.spectralClass}" is not a recognized spectral class (${SPECTRAL_CLASSES.join(', ')})`,
      explanation:
        'The MVP models main-sequence stars of the Morgan–Keenan classes O through M.',
    });
  }
  const massValid = checkRange(diagnostics, {
    parameter: 'stellar.massSolarMasses',
    value: stellar.massSolarMasses,
    unit: 'M☉',
    minimum: HYDROGEN_BURNING_MINIMUM_MASS_SOLAR_MASSES,
    maximum: MAXIMUM_STELLAR_MASS_SOLAR_MASSES,
    explanation:
      'Below ~0.075 M☉ a body cannot sustain hydrogen fusion (it is a brown dwarf); ' +
      'no star more massive than ~150 M☉ has been observed.',
  });
  if (classKnown && massValid) {
    const [classMinimum, classMaximum] = SPECTRAL_CLASS_MASS_RANGE_SOLAR_MASSES[stellar.spectralClass];
    if (stellar.massSolarMasses < classMinimum || stellar.massSolarMasses > classMaximum) {
      diagnostics.push({
        severity: 'warning',
        parameter: 'stellar.massSolarMasses',
        message:
          `stellar.massSolarMasses = ${stellar.massSolarMasses} M☉ is unusual for spectral class ` +
          `${stellar.spectralClass} (typically ${classMinimum}–${classMaximum} M☉)`,
        explanation:
          'A main-sequence star of this mass would normally be classified differently; ' +
          'the simulation derives stellar properties from mass, so the declared class is cosmetic.',
      });
    }
  }
  checkRange(diagnostics, {
    parameter: 'stellar.ageGigayears',
    value: stellar.ageGigayears,
    unit: 'Gyr',
    minimum: 0,
    minimumExclusive: true,
    maximum: UNIVERSE_AGE_GIGAYEARS,
    explanation: 'Stellar age must be positive and cannot exceed the age of the universe.',
  });
}

function validateOrbital(orbital: OrbitalInputParameters, diagnostics: SimulationDiagnostic[]): void {
  checkRange(diagnostics, {
    parameter: 'orbital.semiMajorAxisAstronomicalUnits',
    value: orbital.semiMajorAxisAstronomicalUnits,
    unit: 'AU',
    minimum: 0,
    minimumExclusive: true,
    maximum: MAXIMUM_BOUND_ORBIT_SEMI_MAJOR_AXIS_AU,
    explanation:
      'Orbits wider than ~1 parsec are disrupted by galactic tides and cannot remain bound.',
  });
  checkRange(diagnostics, {
    parameter: 'orbital.eccentricity',
    value: orbital.eccentricity,
    unit: '(dimensionless)',
    minimum: 0,
    maximum: 1,
    maximumExclusive: true,
    explanation: 'The MVP simulates bound orbits only: eccentricity must be in [0, 1).',
  });
}

function validatePlanetary(
  planetary: PlanetaryInputParameters,
  diagnostics: SimulationDiagnostic[],
): void {
  if (!PLANET_COMPOSITION_CLASSES.includes(planetary.compositionClass)) {
    diagnostics.push({
      severity: 'error',
      parameter: 'planetary.compositionClass',
      message: `planetary.compositionClass = "${planetary.compositionClass}" is not a recognized composition class (${PLANET_COMPOSITION_CLASSES.join(', ')})`,
      explanation: 'Surface and albedo modeling require one of the supported bulk compositions.',
    });
  }
  const massValid = checkRange(diagnostics, {
    parameter: 'planetary.massEarthMasses',
    value: planetary.massEarthMasses,
    unit: 'M⊕',
    minimum: 0,
    minimumExclusive: true,
    maximum: MAXIMUM_PLANET_MASS_EARTH_MASSES,
    explanation:
      'Above ~13 Jupiter masses a body ignites deuterium fusion and is a brown dwarf, not a planet.',
  });
  const radiusValid = checkRange(diagnostics, {
    parameter: 'planetary.radiusEarthRadii',
    value: planetary.radiusEarthRadii,
    unit: 'R⊕',
    minimum: 0,
    minimumExclusive: true,
    maximum: MAXIMUM_PLANET_RADIUS_EARTH_RADII,
    explanation:
      'No known planet exceeds ~2.2 Jupiter radii; larger radii imply a stellar object.',
  });
  if (massValid && radiusValid) {
    const impliedDensity = computeBulkDensity(
      planetary.massEarthMasses * EARTH_MASS_KILOGRAMS,
      planetary.radiusEarthRadii * EARTH_EQUATORIAL_RADIUS_METERS,
    );
    if (
      impliedDensity < MINIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER ||
      impliedDensity > MAXIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER
    ) {
      diagnostics.push({
        severity: 'warning',
        parameter: 'planetary.radiusEarthRadii',
        message:
          `The implied bulk density ${impliedDensity.toFixed(1)} kg/m³ is outside the plausible ` +
          `planetary range [${MINIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER}, ` +
          `${MAXIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER}] kg/m³`,
        explanation:
          'No confirmed planet is less dense than the Kepler-51 super-puffs (~30 kg/m³) or ' +
          'denser than compressed iron remnant cores (~30,000 kg/m³); this mass–radius ' +
          'combination is physically suspect.',
      });
    }
  }
}

function validateRotation(rotation: RotationInputParameters, diagnostics: SimulationDiagnostic[]): void {
  if (!Number.isFinite(rotation.rotationPeriodHours) || rotation.rotationPeriodHours === 0) {
    diagnostics.push({
      severity: 'error',
      parameter: 'rotation.rotationPeriodHours',
      message: `rotation.rotationPeriodHours = ${rotation.rotationPeriodHours} h must be a finite, non-zero value`,
      explanation:
        'A rotation period of zero is physically meaningless; negative values denote retrograde rotation.',
    });
  }
  checkRange(diagnostics, {
    parameter: 'rotation.axialTiltDegrees',
    value: rotation.axialTiltDegrees,
    unit: 'degrees',
    minimum: 0,
    maximum: 180,
    explanation:
      'Axial tilt is defined on [0, 180]: values above 90° denote retrograde-tilted rotation axes.',
  });
}

function validateAtmosphere(
  atmosphere: AtmosphereInputParameters,
  diagnostics: SimulationDiagnostic[],
): void {
  let totalPressureKilopascals = 0;
  for (const [gas, pressure] of Object.entries(atmosphere.partialPressuresKilopascals)) {
    if (!(ATMOSPHERIC_GASES as readonly string[]).includes(gas)) {
      diagnostics.push({
        severity: 'error',
        parameter: `atmosphere.partialPressuresKilopascals.${gas}`,
        message: `"${gas}" is not a recognized atmospheric gas (${ATMOSPHERIC_GASES.join(', ')})`,
        explanation: 'The MVP atmosphere model supports a fixed set of well-characterized gases.',
      });
      continue;
    }
    if (typeof pressure !== 'number') {
      diagnostics.push({
        severity: 'error',
        parameter: `atmosphere.partialPressuresKilopascals.${gas}`,
        message: `Partial pressure of ${gas} must be a number, got ${typeof pressure}`,
        explanation: 'Partial pressures are numeric surface pressures in kilopascals.',
      });
      continue;
    }
    const pressureValid = checkRange(diagnostics, {
      parameter: `atmosphere.partialPressuresKilopascals.${gas}`,
      value: pressure,
      unit: 'kPa',
      minimum: 0,
      maximum: MAXIMUM_MODELED_SURFACE_PRESSURE_KILOPASCALS,
      explanation:
        'Partial pressures must be non-negative and within the validity domain of the ' +
        'single-layer atmosphere model (~1,000 bar).',
    });
    if (pressureValid) {
      totalPressureKilopascals += pressure;
    }
  }
  if (totalPressureKilopascals > MAXIMUM_MODELED_SURFACE_PRESSURE_KILOPASCALS) {
    diagnostics.push({
      severity: 'warning',
      parameter: 'atmosphere.partialPressuresKilopascals',
      message:
        `Total surface pressure ${totalPressureKilopascals} kPa exceeds the model validity ` +
        `domain of ${MAXIMUM_MODELED_SURFACE_PRESSURE_KILOPASCALS} kPa`,
      explanation:
        'Above ~1,000 bar the atmosphere approaches supercritical regimes the single-layer ' +
        'model does not represent; computed temperatures and pressures will be unreliable.',
    });
  }
}

/**
 * Validates a complete planet configuration, collecting all diagnostics.
 * The configuration is valid when no error-severity diagnostics exist;
 * warnings flag physically suspect but simulable inputs.
 */
export function validatePlanetConfiguration(
  configuration: PlanetConfiguration,
): ConfigurationValidationResult {
  const diagnostics: SimulationDiagnostic[] = [];
  validateStellar(configuration.stellar, diagnostics);
  validateOrbital(configuration.orbital, diagnostics);
  validatePlanetary(configuration.planetary, diagnostics);
  validateRotation(configuration.rotation, diagnostics);
  validateAtmosphere(configuration.atmosphere, diagnostics);
  return {
    valid: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    diagnostics,
  };
}
