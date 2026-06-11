/**
 * @module translation/time.test
 */

import { describe, expect, it } from 'vitest';

import { translateDayLength, translateOrbitalPeriod } from './time';

const HOUR = 3600;
const DAY = 86_400;
const YEAR = 365.25 * DAY;

describe('translateDayLength', () => {
  it.each([
    [5 * HOUR, 'Very short day'],
    [24 * HOUR, 'Earth-like day'],
    [100 * HOUR, 'Long day'],
    [300 * HOUR, 'Very long day'],
    [1000 * HOUR, 'Extremely long day'],
  ])('classifies %d s as %s', (seconds, brief) => {
    const result = translateDayLength(seconds);
    expect(result.brief).toBe(brief);
    expect(result.earthComparison).toContain('24 hours');
  });

  it('notes retrograde rotation for a negative period', () => {
    const result = translateDayLength(-24 * HOUR);
    expect(result.brief).toBe('Earth-like day');
    expect(result.narrative).toContain('rises in the west');
  });

  it('does not mention retrograde for prograde rotation', () => {
    expect(translateDayLength(24 * HOUR).narrative).not.toContain('rises in the west');
  });
});

describe('translateOrbitalPeriod', () => {
  it.each([
    [5 * DAY, 'Ultra-short year'],
    [88 * DAY, 'Short year'],
    [365.25 * DAY, 'Earth-like year'],
    [10 * YEAR, 'Long year'],
    [100 * YEAR, 'Very long year'],
  ])('classifies %d s as %s', (seconds, brief) => {
    const result = translateOrbitalPeriod(seconds);
    expect(result.brief).toBe(brief);
    expect(result.earthComparison).toContain('365 days');
  });

  it('reports a near-Earth year as ~365 days', () => {
    expect(translateOrbitalPeriod(365.25 * DAY).narrative).toContain('365 Earth days');
  });
});
