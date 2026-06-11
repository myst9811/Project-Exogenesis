/**
 * @module physics/configuration/earthBaseline
 *
 * The canonical Earth–Sun reference configuration: the regression anchor
 * for validation and hashing tests, and the natural default configuration
 * for a new simulation. Every value is cited (docs/references.md).
 */

import type { PlanetConfiguration } from '../../types/configuration';

/**
 * Returns a fresh Earth–Sun configuration.
 *
 * Sources:
 *   - Solar age 4.567 Gyr: Bouvier & Wadhwa (2010)
 *   - Orbital elements and rotation: NASA Earth Fact Sheet / IERS
 *     (sidereal day 23.9345 h; obliquity 23.44°; eccentricity 0.0167)
 *   - Atmospheric partial pressures: US Standard Atmosphere 1976 total
 *     (101.325 kPa) × CRC Handbook dry-air molar fractions
 *     (N₂ 78.08%, O₂ 20.95%, Ar 0.93%, CO₂ ~0.04%), with a global-mean
 *     surface water-vapor partial pressure of ~1.3 kPa (≈77% relative
 *     humidity at 288 K; Hartmann, Global Physical Climatology, 2nd ed.)
 */
export function createEarthBaselineConfiguration(): PlanetConfiguration {
  return {
    stellar: {
      spectralClass: 'G',
      massSolarMasses: 1.0,
      ageGigayears: 4.567,
    },
    orbital: {
      semiMajorAxisAstronomicalUnits: 1.0,
      eccentricity: 0.0167,
    },
    planetary: {
      massEarthMasses: 1.0,
      radiusEarthRadii: 1.0,
      compositionClass: 'rocky-silicate',
    },
    rotation: {
      rotationPeriodHours: 23.9345,
      axialTiltDegrees: 23.44,
    },
    atmosphere: {
      partialPressuresKilopascals: {
        N2: 78.08,
        O2: 20.95,
        Ar: 0.93,
        CO2: 0.04,
        H2O: 1.3,
      },
    },
  };
}
