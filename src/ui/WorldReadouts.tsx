/**
 * @module ui/WorldReadouts
 *
 * Reads the computed `PlanetaryState` from the simulation store and renders
 * a felt-experience card per property via the translation layer. Pure
 * display: it performs no physics, only formatting of values the engine
 * produced.
 */

import type { JSX } from 'react';

import {
  translateDayLength,
  translateEscapeVelocity,
  translateGravity,
  translateOrbitalPeriod,
  translatePressure,
  translateSurfaceTemperature,
} from '../translation';
import { GravityGauge } from './GravityGauge';
import { ReadoutCard } from './ReadoutCard';
import { ThermalSpectrum } from './ThermalSpectrum';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const KELVIN_TO_CELSIUS_OFFSET = 273.15;

export function WorldReadouts(): JSX.Element {
  const { simulation } = useStores();
  const state = useStore(simulation);
  const world = state.planetaryState;

  if (world === null) {
    return (
      <section className="readouts" aria-label="world readouts">
        <p>Configure a world to see its computed properties.</p>
      </section>
    );
  }

  const rotationHours = world.configuration.rotation.rotationPeriodHours;
  const surfaceCelsius = Math.round(world.climate.surfaceTemperatureKelvin - KELVIN_TO_CELSIUS_OFFSET);

  return (
    <section className="readouts" aria-label="world readouts">
      <ReadoutCard
        label="Gravity"
        translation={translateGravity(world.bulk.surfaceGravityMetersPerSecondSquared)}
        rawValue={`${world.bulk.surfaceGravityMetersPerSecondSquared.toFixed(2)} m/s²`}
        instrument={
          <GravityGauge
            surfaceGravityMetersPerSecondSquared={world.bulk.surfaceGravityMetersPerSecondSquared}
          />
        }
      />
      <ReadoutCard
        label="Surface Temperature"
        translation={translateSurfaceTemperature(world.climate.surfaceTemperatureKelvin)}
        rawValue={`${Math.round(world.climate.surfaceTemperatureKelvin)} K | ${surfaceCelsius} °C`}
        instrument={<ThermalSpectrum temperatureKelvin={world.climate.surfaceTemperatureKelvin} />}
      />
      <ReadoutCard
        label="Atmospheric Pressure"
        translation={translatePressure(world.atmosphere.surfacePressureKilopascals)}
        rawValue={`${world.atmosphere.surfacePressureKilopascals.toFixed(1)} kPa`}
      />
      <ReadoutCard
        label="Escape Velocity"
        translation={translateEscapeVelocity(world.bulk.escapeVelocityMetersPerSecond)}
        rawValue={`${(world.bulk.escapeVelocityMetersPerSecond / 1000).toFixed(1)} km/s`}
      />
      <ReadoutCard
        label="Day Length"
        translation={translateDayLength(rotationHours * SECONDS_PER_HOUR)}
        rawValue={`${rotationHours.toFixed(1)} h`}
      />
      <ReadoutCard
        label="Year Length"
        translation={translateOrbitalPeriod(world.orbit.orbitalPeriodSeconds)}
        rawValue={`${(world.orbit.orbitalPeriodSeconds / SECONDS_PER_DAY).toFixed(0)} days`}
      />
    </section>
  );
}
