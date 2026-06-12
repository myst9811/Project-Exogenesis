/**
 * @module ui/GravityGauge
 *
 * A comparative gravity gauge: a horizontal scale with reference bodies
 * (Mars, Earth, super-Earth, Jupiter) and a needle at the world's surface
 * gravity. Pure SVG, so it renders identically in tests and the browser.
 * Reads the computed gravity; authors no physics.
 */

import type { JSX } from 'react';

const STANDARD_GRAVITY = 9.80665;
const SCALE_MAX_G = 3;
const WIDTH = 300;
const HEIGHT = 54;
const TRACK_Y = 30;
const TRACK_LEFT = 8;
const TRACK_RIGHT = WIDTH - 8;

const REFERENCES: { label: string; g: number }[] = [
  { label: 'MARS', g: 0.38 },
  { label: 'EARTH', g: 1.0 },
  { label: 'SUPER-E', g: 2.0 },
  { label: 'JUPITER', g: 2.53 },
];

/** Maps a gravity value in g to an x coordinate on the track. */
function gToX(g: number): number {
  const clamped = Math.max(0, Math.min(SCALE_MAX_G, g));
  return TRACK_LEFT + (clamped / SCALE_MAX_G) * (TRACK_RIGHT - TRACK_LEFT);
}

export function GravityGauge({
  surfaceGravityMetersPerSecondSquared,
}: {
  surfaceGravityMetersPerSecondSquared: number;
}): JSX.Element {
  const gravityG = surfaceGravityMetersPerSecondSquared / STANDARD_GRAVITY;
  const needleX = gToX(gravityG);

  return (
    <svg
      className="gravity-gauge"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Gravity ${gravityG.toFixed(2)} g on a comparative scale`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="gravity-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--status-nominal)" />
          <stop offset="55%" stopColor="var(--status-caution)" />
          <stop offset="100%" stopColor="var(--status-critical)" />
        </linearGradient>
      </defs>

      <line
        x1={TRACK_LEFT}
        y1={TRACK_Y}
        x2={TRACK_RIGHT}
        y2={TRACK_Y}
        stroke="var(--border-dim)"
        strokeWidth="6"
      />
      <line
        x1={TRACK_LEFT}
        y1={TRACK_Y}
        x2={needleX}
        y2={TRACK_Y}
        stroke="url(#gravity-fill)"
        strokeWidth="6"
      />

      {REFERENCES.map((reference) => {
        const x = gToX(reference.g);
        return (
          <g key={reference.label}>
            <line
              x1={x}
              y1={TRACK_Y - 6}
              x2={x}
              y2={TRACK_Y + 6}
              stroke="var(--text-secondary)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={TRACK_Y + 18}
              fill="var(--text-secondary)"
              fontSize="6.5"
              fontFamily="var(--font-data)"
              textAnchor="middle"
            >
              {reference.label}
            </text>
          </g>
        );
      })}

      <polygon
        points={`${needleX - 4},${TRACK_Y - 12} ${needleX + 4},${TRACK_Y - 12} ${needleX},${TRACK_Y - 5}`}
        fill="var(--cyan-bright)"
      />
    </svg>
  );
}
