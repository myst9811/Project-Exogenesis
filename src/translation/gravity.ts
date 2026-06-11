/**
 * @module translation/gravity
 *
 * Translates surface gravity and escape velocity into felt experience.
 * Inputs are in human-facing units (Earth-gravity ratio, m/s) so the layer
 * stays free of physics-engine constants (CLAUDE.md §4 boundary).
 */

import type { HumanTranslation } from '../types/translation';

/**
 * Translates surface gravity, expressed as a multiple of Earth's gravity.
 *
 * @param gravityEarthUnits - Surface gravity in Earth gravities (g)
 * @returns Felt-experience translation
 */
export function translateGravity(gravityEarthUnits: number): HumanTranslation {
  const earthComparison = `${gravityEarthUnits.toFixed(2)}× Earth's surface gravity.`;
  if (gravityEarthUnits < 0.1) {
    return {
      brief: 'Negligible gravity',
      narrative:
        'Gravity is so weak you would drift more than walk — a gentle push could lift you off the ground for long seconds.',
      earthComparison,
    };
  }
  if (gravityEarthUnits < 0.5) {
    return {
      brief: 'Very low gravity',
      narrative:
        'Movement feels buoyant; as on the Moon or Mars, you could leap several times higher than on Earth and land softly.',
      earthComparison,
    };
  }
  if (gravityEarthUnits < 0.85) {
    return {
      brief: 'Low gravity',
      narrative:
        'Noticeably lighter than Earth — your step carries extra spring and lifting feels easy.',
      earthComparison,
    };
  }
  if (gravityEarthUnits <= 1.15) {
    return {
      brief: 'Earth-like gravity',
      narrative: 'Standing and walking feel essentially as they do on Earth.',
      earthComparison,
    };
  }
  if (gravityEarthUnits <= 1.5) {
    return {
      brief: 'Heavy gravity',
      narrative:
        'Everything feels weightier; long days on your feet would tire you faster than on Earth.',
      earthComparison,
    };
  }
  if (gravityEarthUnits <= 3) {
    return {
      brief: 'Very heavy gravity',
      narrative: `Your body feels ${gravityEarthUnits.toFixed(1)} times heavier — simply standing is like wearing a loaded pack, and a fall could injure.`,
      earthComparison,
    };
  }
  return {
    brief: 'Crushing gravity',
    narrative: `Movement is exhausting and hazardous; at over ${gravityEarthUnits.toFixed(1)}× Earth weight the heart struggles to pump blood upward.`,
    earthComparison,
  };
}

/**
 * Translates surface escape velocity.
 *
 * @param escapeVelocityMetersPerSecond - Escape velocity in m/s
 * @returns Felt-experience translation
 */
export function translateEscapeVelocity(
  escapeVelocityMetersPerSecond: number,
): HumanTranslation {
  const kilometersPerSecond = escapeVelocityMetersPerSecond / 1000;
  const earthComparison = `Earth's escape velocity is 11.2 km/s.`;
  if (kilometersPerSecond < 3) {
    return {
      brief: 'Very low escape velocity',
      narrative: `At ${kilometersPerSecond.toFixed(1)} km/s, leaving this world takes little energy — like the Moon — and gases escape easily, so any atmosphere is likely thin.`,
      earthComparison,
    };
  }
  if (kilometersPerSecond < 8) {
    return {
      brief: 'Low escape velocity',
      narrative: `Reaching space is easier than on Earth (about ${kilometersPerSecond.toFixed(1)} km/s), comparable to Mars.`,
      earthComparison,
    };
  }
  if (kilometersPerSecond < 13) {
    return {
      brief: 'Earth-like escape velocity',
      narrative: `Reaching orbit takes energy similar to Earth's, about ${kilometersPerSecond.toFixed(1)} km/s.`,
      earthComparison,
    };
  }
  if (kilometersPerSecond < 25) {
    return {
      brief: 'High escape velocity',
      narrative: `Launching to space is far harder than on Earth (about ${kilometersPerSecond.toFixed(0)} km/s); the strong gravity also retains a thick atmosphere.`,
      earthComparison,
    };
  }
  return {
    brief: 'Very high escape velocity',
    narrative: `Escaping demands enormous energy (about ${kilometersPerSecond.toFixed(0)} km/s), like a giant planet — Jupiter's is roughly 60 km/s.`,
    earthComparison,
  };
}
