/**
 * @module translation/gravity.test
 */

import { describe, expect, it } from 'vitest';

import { translateEscapeVelocity, translateGravity } from './gravity';

/** Earth-gravity ratios expressed as the m/s² the function now expects. */
const G0 = 9.80665;

describe('translateGravity', () => {
  it('anchors to Earth with the computed ratio', () => {
    const result = translateGravity(G0); // 1.00 g
    expect(result.earthComparison).toContain("1.00× Earth's surface gravity");
  });

  it.each([
    [0.05 * G0, 'Negligible gravity'],
    [0.3 * G0, 'Very low gravity'],
    [0.7 * G0, 'Low gravity'],
    [1.0 * G0, 'Earth-like gravity'],
    [1.15 * G0, 'Earth-like gravity'],
    [1.3 * G0, 'Heavy gravity'],
    [2.0 * G0, 'Very heavy gravity'],
    [4.0 * G0, 'Crushing gravity'],
  ])('classifies %f m/s² as %s', (gravity, brief) => {
    const result = translateGravity(gravity);
    expect(result.brief).toBe(brief);
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('reports the multiplier in the very-heavy narrative', () => {
    expect(translateGravity(2.0 * G0).narrative).toContain('2.0 times heavier');
  });
});

describe('translateEscapeVelocity', () => {
  it.each([
    [2000, 'Very low escape velocity'],
    [5000, 'Low escape velocity'],
    [11186, 'Earth-like escape velocity'],
    [20000, 'High escape velocity'],
    [30000, 'Very high escape velocity'],
  ])('classifies %d m/s as %s', (escapeVelocity, brief) => {
    const result = translateEscapeVelocity(escapeVelocity);
    expect(result.brief).toBe(brief);
    expect(result.earthComparison).toContain('11.2 km/s');
  });

  it('reports the Earth-like value in km/s', () => {
    expect(translateEscapeVelocity(11186).narrative).toContain('11.2 km/s');
  });
});
