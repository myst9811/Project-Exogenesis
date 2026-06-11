/**
 * @module translation/time
 *
 * Translates rotational day length and orbital period into felt
 * experience. Time-unit factors are definitional constants kept local to
 * honor the translation-layer boundary (CLAUDE.md §4).
 */

import type { HumanTranslation } from '../types/translation';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const DAYS_PER_YEAR = 365.25;
const HOURS_PER_WEEK = 168;
const HOURS_PER_MONTH = 720;

/**
 * Translates the length of a day (one rotation). A negative value denotes
 * retrograde rotation, noted in the narrative; the band is chosen by the
 * magnitude.
 *
 * @param dayLengthSeconds - Rotation period in seconds (negative = retrograde)
 * @returns Felt-experience translation
 */
export function translateDayLength(dayLengthSeconds: number): HumanTranslation {
  const hours = Math.abs(dayLengthSeconds) / SECONDS_PER_HOUR;
  const retrograde =
    dayLengthSeconds < 0
      ? ' The planet spins backward relative to its orbit, so the sun rises in the west.'
      : '';
  const earthComparison = `Earth's day is 24 hours.`;
  if (hours < 6) {
    return {
      brief: 'Very short day',
      narrative: `A day flashes by in under six hours; the sun sweeps quickly across the sky.${retrograde}`,
      earthComparison,
    };
  }
  if (hours < 30) {
    return {
      brief: 'Earth-like day',
      narrative: `A day lasts about ${Math.round(hours)} hours, close to Earth's 24.${retrograde}`,
      earthComparison,
    };
  }
  if (hours < HOURS_PER_WEEK) {
    return {
      brief: 'Long day',
      narrative: `Each day and night stretches across what would be several Earth days.${retrograde}`,
      earthComparison,
    };
  }
  if (hours < HOURS_PER_MONTH) {
    return {
      brief: 'Very long day',
      narrative: `A single day-night cycle lasts weeks at a time.${retrograde}`,
      earthComparison,
    };
  }
  return {
    brief: 'Extremely long day',
    narrative: `Day and night each last months; one hemisphere bakes while the other freezes in darkness.${retrograde}`,
    earthComparison,
  };
}

/**
 * Translates the orbital period (one year).
 *
 * @param orbitalPeriodSeconds - Orbital period in seconds
 * @returns Felt-experience translation
 */
export function translateOrbitalPeriod(orbitalPeriodSeconds: number): HumanTranslation {
  const days = orbitalPeriodSeconds / SECONDS_PER_DAY;
  const years = days / DAYS_PER_YEAR;
  const earthComparison = `Earth orbits the Sun every 365 days.`;
  if (days < 10) {
    return {
      brief: 'Ultra-short year',
      narrative: `A full year passes in only about ${days.toFixed(1)} Earth days — this world hugs its star.`,
      earthComparison,
    };
  }
  if (days < 300) {
    return {
      brief: 'Short year',
      narrative: `A year here lasts about ${Math.round(days)} Earth days, shorter than our own.`,
      earthComparison,
    };
  }
  if (days < 500) {
    return {
      brief: 'Earth-like year',
      narrative: `A year lasts about ${Math.round(days)} Earth days, close to Earth's 365.`,
      earthComparison,
    };
  }
  if (years < 50) {
    return {
      brief: 'Long year',
      narrative: `A single orbit takes about ${years.toFixed(1)} Earth years.`,
      earthComparison,
    };
  }
  return {
    brief: 'Very long year',
    narrative: `A year stretches over ${Math.round(years)} Earth years; a person might see only a handful of seasons in a lifetime.`,
    earthComparison,
  };
}
