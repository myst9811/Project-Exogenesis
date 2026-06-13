/**
 * @module ui/HabitabilityGauge
 *
 * A semicircular gauge for the human-baseline survivability score, with the
 * limiting factor named beneath. The arc fills to the score fraction and is
 * colored by survivability band (nominal / caution / critical). Pure SVG so
 * it renders identically in tests and the browser.
 *
 * This surfaces the Phase 3 habitability engine, which the console otherwise
 * never displayed. It reads computed values only (ADR-002) — `score` and
 * `limitingFactor` come from `assessHabitability`.
 */

import type { JSX } from 'react';

import type { SurvivalFactorId } from '../types/habitability';

const CENTER_X = 100;
const CENTER_Y = 100;
const RADIUS = 80;

/** Human-readable label for each survival factor. */
const FACTOR_LABEL: Record<SurvivalFactorId, string> = {
  thermal: 'Thermal',
  pressure: 'Pressure',
  oxygen: 'Oxygen',
  'carbon-dioxide': 'Carbon dioxide',
  gravity: 'Gravity',
};

/** Status band for a 0–100 survivability score (matches the readout tone). */
export function survivabilityTone(score: number): 'nominal' | 'caution' | 'critical' {
  if (score >= 70) {
    return 'nominal';
  }
  if (score >= 40) {
    return 'caution';
  }
  return 'critical';
}

const TONE_STROKE: Record<'nominal' | 'caution' | 'critical', string> = {
  nominal: 'var(--status-nominal)',
  caution: 'var(--status-caution)',
  critical: 'var(--status-critical)',
};

/** Point on the gauge arc at an angle measured CCW from the positive x-axis. */
function arcPoint(degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [CENTER_X + RADIUS * Math.cos(radians), CENTER_Y - RADIUS * Math.sin(radians)];
}

/** SVG arc path from the left end (180°) to a fraction of the upper semicircle. */
function arcPath(fraction: number): string {
  const [startX, startY] = arcPoint(180);
  const [endX, endY] = arcPoint(180 - fraction * 180);
  return `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY}`;
}

export function HabitabilityGauge({
  score,
  limitingFactor,
}: {
  score: number;
  limitingFactor: SurvivalFactorId;
}): JSX.Element {
  const clamped = Math.max(0, Math.min(100, score));
  const tone = survivabilityTone(clamped);

  return (
    <svg
      className="habitability-gauge"
      viewBox="0 0 200 132"
      role="img"
      aria-label={`Survivability ${Math.round(clamped)} of 100, limited by ${FACTOR_LABEL[limitingFactor].toLowerCase()}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={arcPath(1)} fill="none" stroke="var(--border-dim)" strokeWidth="10" />
      <path
        d={arcPath(clamped / 100)}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth="10"
      />
      <text
        x={CENTER_X}
        y={CENTER_Y - 8}
        fill="var(--text-readout)"
        fontFamily="var(--font-data)"
        fontSize="30"
        textAnchor="middle"
      >
        {Math.round(clamped)}
      </text>
      <text
        x={CENTER_X}
        y={CENTER_Y + 18}
        fill="var(--text-secondary)"
        fontFamily="var(--font-data)"
        fontSize="9"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        / 100 SURVIVABILITY
      </text>
      <text
        x={CENTER_X}
        y={126}
        fill="var(--text-secondary)"
        fontFamily="var(--font-data)"
        fontSize="9"
        letterSpacing="1"
        textAnchor="middle"
      >
        LIMIT · {FACTOR_LABEL[limitingFactor].toUpperCase()}
      </text>
    </svg>
  );
}
