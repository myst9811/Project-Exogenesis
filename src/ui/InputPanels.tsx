/**
 * @module ui/InputPanels
 *
 * The world-editor panels. Each control reads the current configuration
 * from the simulation store and, on commit, dispatches a new immutable
 * configuration through `commitConfiguration` — typed inputs only, never
 * computed outputs (CLAUDE.md §4, §15). The physics engine produces every
 * resulting value; these panels only supply its inputs.
 */

import type { JSX } from 'react';

import { commitConfiguration } from '../store';
import {
  ATMOSPHERIC_GASES,
  PLANET_COMPOSITION_CLASSES,
  SPECTRAL_CLASSES,
} from '../types/configuration';
import type {
  AtmosphericGas,
  PlanetCompositionClass,
  PlanetConfiguration,
  SpectralClass,
} from '../types/configuration';
import { NumberField } from './NumberField';
import { TacticalPanel } from './TacticalPanel';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

export function InputPanels(): JSX.Element | null {
  const stores = useStores();
  const state = useStore(stores.simulation);
  const config = state.configuration;

  if (config === null) {
    return null;
  }

  const apply = (next: PlanetConfiguration): void => {
    void commitConfiguration(stores, next);
  };

  return (
    <form className="input-panels" aria-label="world parameters">
      <TacticalPanel index={0} eyebrow="Subsystem 01" title="Stellar Data">
        <label className="select-field">
          <span className="field-label">Spectral class</span>
          <select
            value={config.stellar.spectralClass}
            onChange={(event) => {
              apply({
                ...config,
                stellar: { ...config.stellar, spectralClass: event.target.value as SpectralClass },
              });
            }}
          >
            {SPECTRAL_CLASSES.map((spectralClass) => (
              <option key={spectralClass} value={spectralClass}>
                {spectralClass}
              </option>
            ))}
          </select>
        </label>
        <NumberField
          label="Mass"
          unit="M☉"
          value={config.stellar.massSolarMasses}
          min={0.075}
          max={150}
          step={0.1}
          onCommit={(massSolarMasses) => {
            apply({ ...config, stellar: { ...config.stellar, massSolarMasses } });
          }}
        />
        <NumberField
          label="Age"
          unit="Gyr"
          value={config.stellar.ageGigayears}
          min={0}
          step={0.1}
          onCommit={(ageGigayears) => {
            apply({ ...config, stellar: { ...config.stellar, ageGigayears } });
          }}
        />
      </TacticalPanel>

      <TacticalPanel index={1} eyebrow="Subsystem 02" title="Orbital Parameters">
        <NumberField
          label="Semi-major axis"
          unit="AU"
          value={config.orbital.semiMajorAxisAstronomicalUnits}
          min={0}
          step={0.01}
          onCommit={(semiMajorAxisAstronomicalUnits) => {
            apply({ ...config, orbital: { ...config.orbital, semiMajorAxisAstronomicalUnits } });
          }}
        />
        <NumberField
          label="Eccentricity"
          value={config.orbital.eccentricity}
          min={0}
          max={0.99}
          step={0.01}
          onCommit={(eccentricity) => {
            apply({ ...config, orbital: { ...config.orbital, eccentricity } });
          }}
        />
      </TacticalPanel>

      <TacticalPanel index={2} eyebrow="Subsystem 03" title="Planetary Body">
        <NumberField
          label="Mass"
          unit="M⊕"
          value={config.planetary.massEarthMasses}
          min={0}
          step={0.1}
          onCommit={(massEarthMasses) => {
            apply({ ...config, planetary: { ...config.planetary, massEarthMasses } });
          }}
        />
        <NumberField
          label="Radius"
          unit="R⊕"
          value={config.planetary.radiusEarthRadii}
          min={0}
          step={0.1}
          onCommit={(radiusEarthRadii) => {
            apply({ ...config, planetary: { ...config.planetary, radiusEarthRadii } });
          }}
        />
        <label className="select-field">
          <span className="field-label">Composition</span>
          <select
            value={config.planetary.compositionClass}
            onChange={(event) => {
              apply({
                ...config,
                planetary: {
                  ...config.planetary,
                  compositionClass: event.target.value as PlanetCompositionClass,
                },
              });
            }}
          >
            {PLANET_COMPOSITION_CLASSES.map((compositionClass) => (
              <option key={compositionClass} value={compositionClass}>
                {compositionClass}
              </option>
            ))}
          </select>
        </label>
      </TacticalPanel>

      <TacticalPanel index={3} eyebrow="Subsystem 04" title="Rotation">
        <NumberField
          label="Rotation period"
          unit="h"
          value={config.rotation.rotationPeriodHours}
          step={1}
          onCommit={(rotationPeriodHours) => {
            apply({ ...config, rotation: { ...config.rotation, rotationPeriodHours } });
          }}
        />
        <NumberField
          label="Axial tilt"
          unit="°"
          value={config.rotation.axialTiltDegrees}
          min={0}
          max={180}
          step={1}
          onCommit={(axialTiltDegrees) => {
            apply({ ...config, rotation: { ...config.rotation, axialTiltDegrees } });
          }}
        />
      </TacticalPanel>

      <TacticalPanel index={4} eyebrow="Subsystem 05" title="Atmospheric Composition">
        <p className="panel-note">Partial pressures · kPa</p>
        {ATMOSPHERIC_GASES.map((gas: AtmosphericGas) => (
          <NumberField
            key={gas}
            label={gas}
            unit="kPa"
            value={config.atmosphere.partialPressuresKilopascals[gas] ?? 0}
            min={0}
            step={0.5}
            onCommit={(pressure) => {
              apply({
                ...config,
                atmosphere: {
                  partialPressuresKilopascals: {
                    ...config.atmosphere.partialPressuresKilopascals,
                    [gas]: pressure,
                  },
                },
              });
            }}
          />
        ))}
      </TacticalPanel>
    </form>
  );
}
