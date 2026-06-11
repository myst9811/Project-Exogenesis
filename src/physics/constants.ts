/**
 * @module physics/constants
 *
 * Physical constants used by the simulation engine. Every constant is
 * SI unless a clear domain reason exists, named with its standard symbol
 * as a suffix where one exists, and sourced with a citation (CLAUDE.md §5).
 * Empirical values are annotated with `ESTIMATE:`. Full citations live in
 * docs/references.md.
 */

import type { AtmosphericGas, SpectralClass } from '../types/configuration';

// ── Fundamental constants ──────────────────────────────────────────────────

/** Newtonian constant of gravitation. Source: CODATA 2022 (NIST SP 961). */
export const GRAVITATIONAL_CONSTANT_G = 6.674_30e-11; // m³ kg⁻¹ s⁻²

/** Stefan–Boltzmann constant. Exact (derived from SI defining constants). Source: CODATA 2022. */
export const STEFAN_BOLTZMANN_CONSTANT_SIGMA = 5.670_374_419e-8; // W m⁻² K⁻⁴

/** Boltzmann constant. Exact since the 2019 SI redefinition. Source: CODATA 2022. */
export const BOLTZMANN_CONSTANT_K_B = 1.380_649e-23; // J K⁻¹

// ── Astronomical units and nominal values ──────────────────────────────────

/** Astronomical unit. Exact by definition. Source: IAU 2012 Resolution B2. */
export const ASTRONOMICAL_UNIT_AU = 1.495_978_707e11; // m

/** Nominal solar radius. Source: IAU 2015 Resolution B3 (Prša et al. 2016). */
export const NOMINAL_SOLAR_RADIUS_R_SUN = 6.957e8; // m

/** Nominal solar effective temperature. Source: IAU 2015 Resolution B3. */
export const NOMINAL_SOLAR_EFFECTIVE_TEMPERATURE_T_SUN = 5772; // K

/** Nominal solar luminosity. Source: IAU 2015 Resolution B3. */
export const NOMINAL_SOLAR_LUMINOSITY_L_SUN = 3.828e26; // W

/** Nominal solar mass parameter GM☉. Source: IAU 2015 Resolution B3. */
export const NOMINAL_SOLAR_MASS_PARAMETER_GM_SUN = 1.327_124_4e20; // m³ s⁻²

/** Solar mass, derived from the nominal mass parameter: GM☉ / G ≈ 1.9885e30 kg. */
export const SOLAR_MASS_KILOGRAMS = NOMINAL_SOLAR_MASS_PARAMETER_GM_SUN / GRAVITATIONAL_CONSTANT_G;

/** Nominal terrestrial mass parameter GM⊕. Source: IAU 2015 Resolution B3. */
export const NOMINAL_TERRESTRIAL_MASS_PARAMETER_GM_EARTH = 3.986_004e14; // m³ s⁻²

/** Earth mass, derived from the nominal mass parameter: GM⊕ / G ≈ 5.9722e24 kg. */
export const EARTH_MASS_KILOGRAMS =
  NOMINAL_TERRESTRIAL_MASS_PARAMETER_GM_EARTH / GRAVITATIONAL_CONSTANT_G;

/**
 * Nominal terrestrial equatorial radius — the R⊕ used as the unit of
 * planetary radius inputs, matching exoplanet literature convention.
 * Source: IAU 2015 Resolution B3.
 */
export const EARTH_EQUATORIAL_RADIUS_METERS = 6.378_1e6; // m

/** Nominal jovian mass parameter GM♃. Source: IAU 2015 Resolution B3. */
export const NOMINAL_JOVIAN_MASS_PARAMETER_GM_JUP = 1.266_865_3e17; // m³ s⁻²

/** Jupiter mass, derived from the nominal mass parameter: GM♃ / G ≈ 1.898e27 kg. */
export const JUPITER_MASS_KILOGRAMS =
  NOMINAL_JOVIAN_MASS_PARAMETER_GM_JUP / GRAVITATIONAL_CONSTANT_G;

// ── Time conversions (exact by definition) ─────────────────────────────────

export const SECONDS_PER_HOUR = 3600; // s
export const SECONDS_PER_DAY = 86_400; // s

// ── Gas physics ────────────────────────────────────────────────────────────

/** Avogadro constant. Exact since the 2019 SI redefinition. Source: CODATA 2022. */
export const AVOGADRO_CONSTANT_N_A = 6.022_140_76e23; // mol⁻¹

/** Molar gas constant R = N_A · k_B. Exact (derived). Source: CODATA 2022. */
export const MOLAR_GAS_CONSTANT_R = AVOGADRO_CONSTANT_N_A * BOLTZMANN_CONSTANT_K_B; // J mol⁻¹ K⁻¹

/** Earth standard sea-level atmospheric pressure. Source: US Standard Atmosphere 1976. */
export const EARTH_SURFACE_PRESSURE_KILOPASCALS = 101.325; // kPa

/**
 * Molar masses of the modeled atmospheric gases, kg/mol.
 * Source: CIAAW 2021 standard atomic weights (via NIST WebBook).
 */
export const MOLAR_MASS_KILOGRAMS_PER_MOLE: Record<AtmosphericGas, number> = {
  N2: 28.0134e-3,
  O2: 31.9988e-3,
  CO2: 44.0095e-3,
  H2O: 18.01528e-3,
  CH4: 16.04246e-3,
  H2: 2.01588e-3,
  He: 4.002602e-3,
  Ar: 39.948e-3,
};

// ── Standard gravity ───────────────────────────────────────────────────────

/** Standard gravity g₀, the conventional Earth value. Exact. Source: 3rd CGPM (1901). */
export const STANDARD_GRAVITY_METERS_PER_SECOND_SQUARED = 9.806_65; // m/s²

// ── Water phase physics ────────────────────────────────────────────────────

/** Water freezing point at standard pressure (0 °C, by definition). */
export const WATER_FREEZING_POINT_KELVIN = 273.15; // K

/** Water boiling point at 1 standard atmosphere (100 °C, by definition). */
export const WATER_BOILING_POINT_STANDARD_KELVIN = 373.15; // K

/** Water triple-point pressure — below this, liquid water cannot exist. Source: IAPWS-95 / NIST. */
export const WATER_TRIPLE_POINT_PRESSURE_KILOPASCALS = 0.611_657; // kPa

/**
 * Molar enthalpy of vaporization of water near its normal boiling point.
 * Source: NIST Chemistry WebBook (≈ 40.66 kJ/mol at 373 K).
 */
export const WATER_LATENT_HEAT_VAPORIZATION_JOULES_PER_MOLE = 40_660; // J/mol

// ── Validation bounds (Planet Configuration System) ────────────────────────

/**
 * ESTIMATE: Minimum mass for sustained core hydrogen burning — below this a
 * body is a brown dwarf, not a star. Source: Chabrier & Baraffe (2000).
 */
export const HYDROGEN_BURNING_MINIMUM_MASS_SOLAR_MASSES = 0.075;

/**
 * ESTIMATE: Empirical upper stellar mass limit observed in dense young
 * clusters. Source: Figer (2005).
 */
export const MAXIMUM_STELLAR_MASS_SOLAR_MASSES = 150;

/** ESTIMATE: Age of the universe — upper bound on stellar age. Source: Planck 2018. */
export const UNIVERSE_AGE_GIGAYEARS = 13.787;

/**
 * ESTIMATE: Deuterium-burning mass limit conventionally separating planets
 * from brown dwarfs. Source: Spiegel, Burrows & Milsom (2011).
 */
export const DEUTERIUM_BURNING_LIMIT_JUPITER_MASSES = 13;

/** Deuterium-burning limit expressed in Earth masses (≈ 4,132 M⊕), derived. */
export const MAXIMUM_PLANET_MASS_EARTH_MASSES =
  (DEUTERIUM_BURNING_LIMIT_JUPITER_MASSES * JUPITER_MASS_KILOGRAMS) / EARTH_MASS_KILOGRAMS;

/**
 * ESTIMATE: Lowest bulk density of any confirmed planet — the Kepler-51
 * "super-puffs" at ≈ 0.03–0.06 g/cm³. Configurations below this are flagged
 * as physically suspect. Source: Libby-Roberts et al. (2020).
 */
export const MINIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER = 30;

/**
 * ESTIMATE: Upper bulk density bound for compressed iron-rich remnant cores.
 * Source: Mocquet, Grasset & Sotin (2014).
 */
export const MAXIMUM_PLAUSIBLE_PLANET_DENSITY_KILOGRAMS_PER_CUBIC_METER = 30_000;

/**
 * Domain-of-validity bound for the MVP atmosphere model (≈ 1,000 bar; Venus
 * is ≈ 92 bar). Above this, surface conditions approach supercritical
 * regimes the single-layer model does not represent; configurations beyond
 * it are flagged, not rejected (CLAUDE.md §6 uncertainty protocol).
 */
export const MAXIMUM_MODELED_SURFACE_PRESSURE_KILOPASCALS = 100_000;

/**
 * ESTIMATE: Upper bound on bound-orbit semi-major axis (≈ 1 parsec). Beyond
 * this, galactic tides disrupt orbits around field stars.
 * Source: Jiang & Tremaine (2010).
 */
export const MAXIMUM_BOUND_ORBIT_SEMI_MAJOR_AXIS_AU = 200_000;

/**
 * ESTIMATE: Upper bound on planetary radius (≈ 2.2 R♃). The most inflated
 * known hot Jupiters reach ≈ 2 R♃ (e.g. WASP-17b, Anderson et al. 2010).
 */
export const MAXIMUM_PLANET_RADIUS_EARTH_RADII = 25;

/**
 * ESTIMATE: Approximate main-sequence mass ranges per spectral class, in
 * solar masses [minimum, maximum]. Used for the relational consistency check
 * between declared spectral class and stellar mass; boundaries are fuzzy, so
 * mismatches produce warnings, not errors. Source: Pecaut & Mamajek (2013).
 */
export const SPECTRAL_CLASS_MASS_RANGE_SOLAR_MASSES: Record<
  SpectralClass,
  readonly [number, number]
> = {
  O: [16, 150],
  B: [2.1, 16],
  A: [1.4, 2.1],
  F: [1.04, 1.4],
  G: [0.8, 1.04],
  K: [0.45, 0.8],
  M: [0.075, 0.45],
};
