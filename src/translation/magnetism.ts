/**
 * @module translation/magnetism
 *
 * Translates planetary magnetic field strength into felt experience,
 * framed around radiation shielding and atmospheric protection.
 *
 * Note: the MVP physics engine does not yet compute a magnetic field
 * (there is no input for it). This pure translation is ready for a future
 * magnetism module; until then it has no wired source.
 */

import type { HumanTranslation } from '../types/translation';

/** Teslas to microteslas. */
const MICROTESLA_PER_TESLA = 1e6;

/**
 * Translates surface magnetic field strength.
 *
 * @param magneticFieldTesla - Surface magnetic field strength in teslas
 * @returns Felt-experience translation
 */
export function translateMagneticField(magneticFieldTesla: number): HumanTranslation {
  const microtesla = magneticFieldTesla * MICROTESLA_PER_TESLA;
  const earthComparison = `Earth's surface field is about 50 µT.`;
  if (microtesla < 1) {
    return {
      brief: 'Negligible magnetic field',
      narrative:
        'Almost no magnetic shield: stellar wind and cosmic radiation reach the surface largely unimpeded, and the atmosphere is vulnerable to being stripped away over time.',
      earthComparison,
    };
  }
  if (microtesla < 25) {
    return {
      brief: 'Weak magnetic field',
      narrative: `At about ${Math.round(microtesla)} µT the field is weaker than Earth's, offering only partial protection from stellar radiation.`,
      earthComparison,
    };
  }
  if (microtesla <= 65) {
    return {
      brief: 'Earth-like magnetic field',
      narrative: `At about ${Math.round(microtesla)} µT the field rivals Earth's, deflecting much of the stellar wind and lighting auroras near the poles.`,
      earthComparison,
    };
  }
  if (microtesla < 1000) {
    return {
      brief: 'Strong magnetic field',
      narrative: `At about ${Math.round(microtesla)} µT the field is stronger than Earth's, a robust radiation shield with broad auroras.`,
      earthComparison,
    };
  }
  return {
    brief: 'Intense magnetic field',
    narrative: `Far stronger than Earth's, like the giant planets — a vast magnetosphere and powerful auroras.`,
    earthComparison,
  };
}
