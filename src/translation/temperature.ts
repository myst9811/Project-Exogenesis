/**
 * @module translation/temperature
 *
 * Translates surface temperature into felt experience. The Celsius offset
 * is a definitional constant, kept local to honor the translation-layer
 * boundary (CLAUDE.md §4).
 */

import type { HumanTranslation } from '../types/translation';

/** Kelvin-to-Celsius offset (0 °C ≡ 273.15 K, by definition). */
const CELSIUS_ZERO_IN_KELVIN = 273.15;

/**
 * Translates surface temperature.
 *
 * @param temperatureKelvin - Surface temperature in Kelvin
 * @returns Felt-experience translation
 */
export function translateSurfaceTemperature(temperatureKelvin: number): HumanTranslation {
  const celsius = Math.round(temperatureKelvin - CELSIUS_ZERO_IN_KELVIN);
  const earthComparison = `Earth's global average surface is about 15 °C (288 K).`;
  if (temperatureKelvin < 173.15) {
    return {
      brief: 'Cryogenic cold',
      narrative: `At about ${celsius} °C, this is colder than anywhere on Earth — cold enough to freeze carbon dioxide out of the air.`,
      earthComparison,
    };
  }
  if (temperatureKelvin < 243.15) {
    return {
      brief: 'Extreme cold',
      narrative: `At about ${celsius} °C, far colder than Earth's poles; exposed skin would freeze within moments.`,
      earthComparison,
    };
  }
  if (temperatureKelvin < 273.15) {
    return {
      brief: 'Subfreezing',
      narrative: `At about ${celsius} °C the whole surface is below freezing, and any water is locked away as ice.`,
      earthComparison,
    };
  }
  if (temperatureKelvin < 303.15) {
    return {
      brief: 'Temperate',
      narrative: `At about ${celsius} °C this world is comfortable by Earth standards, from a cool morning to a warm afternoon.`,
      earthComparison,
    };
  }
  if (temperatureKelvin < 323.15) {
    return {
      brief: 'Hot',
      narrative: `At about ${celsius} °C it rivals Earth's hottest deserts, where survival means shade and water.`,
      earthComparison,
    };
  }
  if (temperatureKelvin < 373.15) {
    return {
      brief: 'Searing',
      narrative: `At about ${celsius} °C the heat exceeds human endurance and nears the boiling point of water.`,
      earthComparison,
    };
  }
  if (temperatureKelvin < 600) {
    return {
      brief: 'Scorching',
      narrative: `At about ${celsius} °C, hotter than boiling water — no liquid water can persist on the open surface.`,
      earthComparison,
    };
  }
  return {
    brief: 'Infernal',
    narrative: `At about ${celsius} °C it is hot enough to melt lead, comparable to Venus, with the surface glowing in thermal radiation.`,
    earthComparison,
  };
}
