/**
 * @module physics/configuration/validation.test
 */

import { describe, expect, it } from 'vitest';

import type {
  AtmosphericGas,
  PlanetCompositionClass,
  PlanetConfiguration,
  SpectralClass,
} from '../../types/configuration';
import { createEarthBaselineConfiguration } from './earthBaseline';
import { validatePlanetConfiguration } from './validation';

/** Clones the Earth baseline and applies a mutation to it. */
function configurationWith(mutate: (configuration: PlanetConfiguration) => void): PlanetConfiguration {
  const configuration = structuredClone(createEarthBaselineConfiguration());
  mutate(configuration);
  return configuration;
}

function expectError(configuration: PlanetConfiguration, parameter: string): void {
  const result = validatePlanetConfiguration(configuration);
  expect(result.valid).toBe(false);
  expect(
    result.diagnostics.some(
      (diagnostic) => diagnostic.parameter === parameter && diagnostic.severity === 'error',
    ),
  ).toBe(true);
}

function expectWarning(configuration: PlanetConfiguration, parameter: string): void {
  const result = validatePlanetConfiguration(configuration);
  expect(result.valid).toBe(true);
  expect(
    result.diagnostics.some(
      (diagnostic) => diagnostic.parameter === parameter && diagnostic.severity === 'warning',
    ),
  ).toBe(true);
}

describe('validatePlanetConfiguration', () => {
  it('accepts the Earth baseline with zero diagnostics', () => {
    const result = validatePlanetConfiguration(createEarthBaselineConfiguration());
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('accepts an airless world (empty atmosphere map)', () => {
    const result = validatePlanetConfiguration(
      configurationWith((c) => {
        c.atmosphere.partialPressuresKilopascals = {};
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('accepts retrograde rotation (negative rotation period)', () => {
    const result = validatePlanetConfiguration(
      configurationWith((c) => {
        c.rotation.rotationPeriodHours = -5832.6; // Venus
      }),
    );
    expect(result.valid).toBe(true);
  });

  describe('stellar', () => {
    it('rejects an unrecognized spectral class', () => {
      expectError(
        configurationWith((c) => {
          c.stellar.spectralClass = 'X' as SpectralClass;
        }),
        'stellar.spectralClass',
      );
    });

    it('rejects mass below the hydrogen-burning limit', () => {
      expectError(
        configurationWith((c) => {
          c.stellar.massSolarMasses = 0.05;
        }),
        'stellar.massSolarMasses',
      );
    });

    it('rejects mass above the observed stellar maximum', () => {
      expectError(
        configurationWith((c) => {
          c.stellar.massSolarMasses = 200;
        }),
        'stellar.massSolarMasses',
      );
    });

    it('warns when mass is inconsistent with the declared spectral class', () => {
      expectWarning(
        configurationWith((c) => {
          c.stellar.massSolarMasses = 5; // a B-class mass declared as G
        }),
        'stellar.massSolarMasses',
      );
    });

    it('rejects zero age (exclusive minimum)', () => {
      expectError(
        configurationWith((c) => {
          c.stellar.ageGigayears = 0;
        }),
        'stellar.ageGigayears',
      );
    });

    it('rejects age beyond the age of the universe', () => {
      expectError(
        configurationWith((c) => {
          c.stellar.ageGigayears = 20;
        }),
        'stellar.ageGigayears',
      );
    });
  });

  describe('orbital', () => {
    it('rejects a non-finite semi-major axis', () => {
      expectError(
        configurationWith((c) => {
          c.orbital.semiMajorAxisAstronomicalUnits = Number.NaN;
        }),
        'orbital.semiMajorAxisAstronomicalUnits',
      );
    });

    it('rejects a zero semi-major axis', () => {
      expectError(
        configurationWith((c) => {
          c.orbital.semiMajorAxisAstronomicalUnits = 0;
        }),
        'orbital.semiMajorAxisAstronomicalUnits',
      );
    });

    it('rejects negative eccentricity', () => {
      expectError(
        configurationWith((c) => {
          c.orbital.eccentricity = -0.1;
        }),
        'orbital.eccentricity',
      );
    });

    it('rejects eccentricity of exactly 1 (unbound orbit, exclusive maximum)', () => {
      expectError(
        configurationWith((c) => {
          c.orbital.eccentricity = 1;
        }),
        'orbital.eccentricity',
      );
    });
  });

  describe('planetary', () => {
    it('rejects an unrecognized composition class', () => {
      expectError(
        configurationWith((c) => {
          c.planetary.compositionClass = 'unobtainium' as PlanetCompositionClass;
        }),
        'planetary.compositionClass',
      );
    });

    it('rejects zero mass', () => {
      expectError(
        configurationWith((c) => {
          c.planetary.massEarthMasses = 0;
        }),
        'planetary.massEarthMasses',
      );
    });

    it('rejects mass above the deuterium-burning limit', () => {
      expectError(
        configurationWith((c) => {
          c.planetary.massEarthMasses = 5000; // > ~4,132 M⊕ (13 M♃)
        }),
        'planetary.massEarthMasses',
      );
    });

    it('rejects zero radius', () => {
      expectError(
        configurationWith((c) => {
          c.planetary.radiusEarthRadii = 0;
        }),
        'planetary.radiusEarthRadii',
      );
    });

    it('rejects radius above the inflated hot-Jupiter ceiling', () => {
      expectError(
        configurationWith((c) => {
          c.planetary.radiusEarthRadii = 30;
        }),
        'planetary.radiusEarthRadii',
      );
    });

    it('warns when implied density is below the super-puff minimum', () => {
      expectWarning(
        configurationWith((c) => {
          c.planetary.massEarthMasses = 1;
          c.planetary.radiusEarthRadii = 8; // ~11 kg/m³
        }),
        'planetary.radiusEarthRadii',
      );
    });

    it('warns when implied density exceeds compressed iron cores', () => {
      expectWarning(
        configurationWith((c) => {
          c.planetary.massEarthMasses = 1;
          c.planetary.radiusEarthRadii = 0.3; // ~200,000 kg/m³
        }),
        'planetary.radiusEarthRadii',
      );
    });

    it('skips the density check when mass is invalid', () => {
      const result = validatePlanetConfiguration(
        configurationWith((c) => {
          c.planetary.massEarthMasses = 0;
          c.planetary.radiusEarthRadii = 8;
        }),
      );
      expect(result.diagnostics.filter((d) => d.severity === 'warning')).toEqual([]);
    });
  });

  describe('rotation', () => {
    it('rejects a zero rotation period', () => {
      expectError(
        configurationWith((c) => {
          c.rotation.rotationPeriodHours = 0;
        }),
        'rotation.rotationPeriodHours',
      );
    });

    it('rejects a non-finite rotation period', () => {
      expectError(
        configurationWith((c) => {
          c.rotation.rotationPeriodHours = Infinity;
        }),
        'rotation.rotationPeriodHours',
      );
    });

    it('rejects negative axial tilt', () => {
      expectError(
        configurationWith((c) => {
          c.rotation.axialTiltDegrees = -1;
        }),
        'rotation.axialTiltDegrees',
      );
    });

    it('rejects axial tilt above 180 degrees (inclusive maximum)', () => {
      expectError(
        configurationWith((c) => {
          c.rotation.axialTiltDegrees = 181;
        }),
        'rotation.axialTiltDegrees',
      );
    });
  });

  describe('atmosphere', () => {
    it('rejects an unrecognized gas species', () => {
      expectError(
        configurationWith((c) => {
          (c.atmosphere.partialPressuresKilopascals as Record<string, number>).Xe = 10;
        }),
        'atmosphere.partialPressuresKilopascals.Xe',
      );
    });

    it('rejects a non-numeric partial pressure', () => {
      expectError(
        configurationWith((c) => {
          (c.atmosphere.partialPressuresKilopascals as Record<AtmosphericGas, unknown>).N2 =
            'lots';
        }),
        'atmosphere.partialPressuresKilopascals.N2',
      );
    });

    it('rejects a negative partial pressure', () => {
      expectError(
        configurationWith((c) => {
          c.atmosphere.partialPressuresKilopascals.N2 = -5;
        }),
        'atmosphere.partialPressuresKilopascals.N2',
      );
    });

    it('warns when total pressure exceeds the model validity domain', () => {
      expectWarning(
        configurationWith((c) => {
          c.atmosphere.partialPressuresKilopascals = { N2: 90_000, O2: 90_000 };
        }),
        'atmosphere.partialPressuresKilopascals',
      );
    });

    it('excludes invalid partial pressures from the total-pressure check', () => {
      const result = validatePlanetConfiguration(
        configurationWith((c) => {
          c.atmosphere.partialPressuresKilopascals = { N2: 200_000 }; // per-gas error
        }),
      );
      expect(result.valid).toBe(false);
      expect(result.diagnostics.filter((d) => d.severity === 'warning')).toEqual([]);
    });
  });
});
