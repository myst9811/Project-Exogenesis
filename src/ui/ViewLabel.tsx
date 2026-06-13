/**
 * @module ui/ViewLabel
 *
 * A small HUD caption naming the active viewport perspective. In the System
 * view it appends the honest orbit note: the real semi-major axis with an
 * explicit "schematic / not to scale" qualifier (CLAUDE.md §6), since an orbit
 * cannot be drawn to scale beside a planet. Pure presentational chrome.
 */

import type { JSX } from 'react';

import type { PlanetView } from '../types/render';

const VIEW_NAME: Record<PlanetView, string> = {
  observation: 'OBSERVATION',
  surface: 'SURFACE',
  system: 'SYSTEM',
};

export function ViewLabel({
  view,
  semiMajorAxisAu,
}: {
  view: PlanetView;
  semiMajorAxisAu: number;
}): JSX.Element {
  return (
    <div className="view-label" aria-hidden="true">
      <span className="view-label__name">{VIEW_NAME[view]}</span>
      {view === 'system' && (
        <span className="view-label__note">
          ORBIT · {semiMajorAxisAu.toFixed(2)} AU · SCHEMATIC · NOT TO SCALE
        </span>
      )}
    </div>
  );
}
