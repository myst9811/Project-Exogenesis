/**
 * @module ui/ModeRail
 *
 * The viewport perspective switcher: three labeled controls that reframe the
 * camera on the same computed world (Observation / Surface / System). Pure
 * presentational chrome — it owns no state; the selected view and the change
 * handler are supplied by `PlanetViewport`.
 */

import type { JSX } from 'react';

import { MissionIcon, type MissionIconName } from './MissionIcon';
import type { PlanetView } from '../types/render';

interface ViewOption {
  id: PlanetView;
  label: string;
  icon: MissionIconName;
}

const VIEWS: readonly ViewOption[] = [
  { id: 'observation', label: 'Observation', icon: 'cockpit' },
  { id: 'surface', label: 'Surface', icon: 'rover' },
  { id: 'system', label: 'System', icon: 'shuttle' },
];

export function ModeRail({
  view,
  onSelectView,
}: {
  view: PlanetView;
  onSelectView: (view: PlanetView) => void;
}): JSX.Element {
  return (
    <div className="mode-rail" role="group" aria-label="viewport perspectives">
      {VIEWS.map((option) => {
        const isActive = option.id === view;
        return (
          <button
            key={option.id}
            type="button"
            className={`mode-rail__item ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => {
              onSelectView(option.id);
            }}
          >
            <MissionIcon name={option.icon} size={26} state={isActive ? 'active' : 'idle'} />
            <span className="mode-rail__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
