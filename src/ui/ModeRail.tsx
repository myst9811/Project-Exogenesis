/**
 * @module ui/ModeRail
 *
 * The exploration mode rail overlaid on the viewport: the current Observation
 * mode is active; Surface and System are roadmap capabilities, shown locked
 * (CLAUDE.md §16). Presentational only — the mode list is a static constant;
 * no store state exists because only one mode is real today.
 */

import type { JSX } from 'react';

import { MissionIcon, type MissionIconName } from './MissionIcon';

interface ExplorationMode {
  id: string;
  label: string;
  icon: MissionIconName;
  available: boolean;
}

const MODES: readonly ExplorationMode[] = [
  { id: 'observation', label: 'Observation', icon: 'cockpit', available: true },
  { id: 'surface', label: 'Surface', icon: 'rover', available: false },
  { id: 'system', label: 'System', icon: 'shuttle', available: false },
];

export function ModeRail(): JSX.Element {
  return (
    <div className="mode-rail" role="group" aria-label="exploration modes">
      {MODES.map((mode) => (
        <div
          key={mode.id}
          className={`mode-rail__item ${mode.available ? 'is-active' : 'is-locked'}`}
          aria-current={mode.available ? 'true' : undefined}
          aria-disabled={mode.available ? undefined : 'true'}
          title={mode.available ? `${mode.label} (active)` : `${mode.label} — coming soon`}
        >
          <MissionIcon
            name={mode.icon}
            label={mode.label}
            size={26}
            state={mode.available ? 'active' : 'locked'}
          />
        </div>
      ))}
    </div>
  );
}
