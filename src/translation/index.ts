/**
 * @module translation
 *
 * Physics values → human felt experience (CLAUDE.md §15). Each function is
 * pure: it receives one computed value and returns brief, narrative, and
 * Earth-comparison strings. Translations supplement the raw value; they
 * never replace it, and they contain no physics logic of their own.
 */

export type { HumanTranslation } from '../types/translation';
export { translateGravity, translateEscapeVelocity } from './gravity';
export { translateSurfaceTemperature } from './temperature';
export { translatePressure } from './pressure';
export { translateDayLength, translateOrbitalPeriod } from './time';
export { translateMagneticField } from './magnetism';
