/**
 * @module translation/pressure
 *
 * Translates surface atmospheric pressure into felt experience. The
 * standard-atmosphere reference is a definitional constant kept local to
 * honor the translation-layer boundary (CLAUDE.md §4).
 */

import type { HumanTranslation } from '../types/translation';

/** One standard atmosphere in kilopascals (definitional). */
const STANDARD_ATMOSPHERE_KILOPASCALS = 101.325;

/**
 * Translates total surface atmospheric pressure.
 *
 * @param pressureKilopascals - Surface pressure in kilopascals
 * @returns Felt-experience translation
 */
export function translatePressure(pressureKilopascals: number): HumanTranslation {
  const atmospheres = (pressureKilopascals / STANDARD_ATMOSPHERE_KILOPASCALS).toFixed(2);
  const earthComparison = `Earth's sea-level pressure is about 101 kPa (1 atm).`;
  if (pressureKilopascals < 1) {
    return {
      brief: 'Near-vacuum',
      narrative:
        'Barely any atmosphere — as thin as Mars or thinner; without a pressure suit, body fluids would boil.',
      earthComparison,
    };
  }
  if (pressureKilopascals < 50) {
    return {
      brief: 'Thin air',
      narrative: `At about ${atmospheres} atm the air is too thin to breathe comfortably, like the altitude near Everest's summit.`,
      earthComparison,
    };
  }
  if (pressureKilopascals < 120) {
    return {
      brief: 'Earth-like pressure',
      narrative: `At about ${atmospheres} atm the air has Earth-like heft, close to sea-level pressure.`,
      earthComparison,
    };
  }
  if (pressureKilopascals < 500) {
    return {
      brief: 'Dense atmosphere',
      narrative: `At about ${atmospheres} atm the air is noticeably thicker than Earth's, heavy to move through.`,
      earthComparison,
    };
  }
  if (pressureKilopascals < 5000) {
    return {
      brief: 'Crushing atmosphere',
      narrative: `At about ${atmospheres} atm the pressure rivals being tens of metres underwater on Earth.`,
      earthComparison,
    };
  }
  return {
    brief: 'Extreme pressure',
    narrative: `At about ${atmospheres} atm the surface lies under a Venus-like weight of air, like the crushing deep ocean.`,
    earthComparison,
  };
}
