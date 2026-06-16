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
  PlanetConfiguration,
} from '../types/configuration';
import { NumberField } from './NumberField';
import { SpectralClassSelector } from './SpectralClassSelector';
import { TacticalPanel } from './TacticalPanel';
import { Tooltip } from './Tooltip';
import { PARAMETER_TOOLTIPS } from './tooltips/parameterTooltips';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

const COMPOSITION_LABELS = {
  'rocky-silicate': 'Rocky',
  'iron-rich': 'Iron-rich',
  'water-world': 'Water',
  'gas-dwarf': 'Gas Dwarf',
} as const;

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
          <span className="field-label">
            Spectral class
            <Tooltip tooltip={PARAMETER_TOOLTIPS.spectralClass} />
          </span>
          <SpectralClassSelector
            value={config.stellar.spectralClass}
            options={SPECTRAL_CLASSES}
            onChange={(spectralClass) => {
              apply({ ...config, stellar: { ...config.stellar, spectralClass } });
            }}
          />
        </label>
        <NumberField
          label="Mass"
          unit="M☉"
          value={config.stellar.massSolarMasses}
          min={0.075}
          max={150}
          step={0.1}
          tooltip={PARAMETER_TOOLTIPS.stellarMass}
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
          tooltip={PARAMETER_TOOLTIPS.stellarAge}
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
          tooltip={PARAMETER_TOOLTIPS.semiMajorAxis}
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
          tooltip={PARAMETER_TOOLTIPS.eccentricity}
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
          tooltip={PARAMETER_TOOLTIPS.planetMass}
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
          tooltip={PARAMETER_TOOLTIPS.planetRadius}
          onCommit={(radiusEarthRadii) => {
            apply({ ...config, planetary: { ...config.planetary, radiusEarthRadii } });
          }}
        />
        <div className="select-field">
          <span className="field-label">
            Composition
            <Tooltip tooltip={PARAMETER_TOOLTIPS.compositionClass} />
          </span>
          <div className="segmented" role="radiogroup" aria-label="Composition">
            {PLANET_COMPOSITION_CLASSES.map((cls) => (
              <button
                key={cls}
                type="button"
                role="radio"
                aria-checked={cls === config.planetary.compositionClass}
                className={`segmented-option${cls === config.planetary.compositionClass ? ' is-active' : ''}`}
                onClick={() => {
                  if (cls !== config.planetary.compositionClass) {
                    apply({ ...config, planetary: { ...config.planetary, compositionClass: cls } });
                  }
                }}
              >
                {COMPOSITION_LABELS[cls]}
              </button>
            ))}
          </div>
        </div>
      </TacticalPanel>

      <TacticalPanel index={3} eyebrow="Subsystem 04" title="Rotation">
        <NumberField
          label="Rotation period"
          unit="h"
          value={config.rotation.rotationPeriodHours}
          step={1}
          tooltip={PARAMETER_TOOLTIPS.rotationPeriod}
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
          tooltip={PARAMETER_TOOLTIPS.axialTilt}
          onCommit={(axialTiltDegrees) => {
            apply({ ...config, rotation: { ...config.rotation, axialTiltDegrees } });
          }}
        />
      </TacticalPanel>

      <TacticalPanel index={4} eyebrow="Subsystem 05" title="Atmospheric Composition">
        <p className="panel-note">Partial pressures · kPa</p>
        {ATMOSPHERIC_GASES.map((gas: AtmosphericGas) => {
          const gasTooltipKey = {
            N2: 'pressureN2',
            O2: 'pressureO2',
            CO2: 'pressureCO2',
            H2O: 'pressureH2O',
            CH4: 'pressureCH4',
            Ar: 'pressureAr',
            He: 'pressureHe',
            H2: 'pressureH2',
          } as const;
          return (
            <NumberField
              key={gas}
              label={gas}
              unit="kPa"
              value={config.atmosphere.partialPressuresKilopascals[gas] ?? 0}
              min={0}
              step={0.5}
              tooltip={PARAMETER_TOOLTIPS[gasTooltipKey[gas]]}
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
          );
        })}
      </TacticalPanel>
    </form>
  );
}
