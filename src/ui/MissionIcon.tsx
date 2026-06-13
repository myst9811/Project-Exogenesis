/**
 * @module ui/MissionIcon
 *
 * Renders one of the four cleaned space icons inline, themed by `currentColor`
 * (CSS sets the color via the `state` class). Pure chrome — knows nothing of
 * physics, modes, or app state. The SVGs are trusted, static, local assets
 * imported as raw strings, so inline rendering is safe.
 */

import type { CSSProperties, JSX } from 'react';

import cockpit from '../assets/icons/cockpit.svg?raw';
import rocket from '../assets/icons/rocket.svg?raw';
import rover from '../assets/icons/rover.svg?raw';
import shuttle from '../assets/icons/shuttle.svg?raw';

export type MissionIconName = 'rocket' | 'cockpit' | 'rover' | 'shuttle';
export type MissionIconState = 'active' | 'locked' | 'idle';

const SOURCES: Record<MissionIconName, string> = { rocket, cockpit, rover, shuttle };

export function MissionIcon({
  name,
  label,
  size = 24,
  state = 'idle',
}: {
  name: MissionIconName;
  /** Accessible name. Omit to render the icon decoratively (aria-hidden). */
  label?: string;
  size?: number;
  state?: MissionIconState;
}): JSX.Element {
  const style: CSSProperties = { width: size, height: size };
  const a11y =
    label !== undefined
      ? ({ role: 'img', 'aria-label': label } as const)
      : ({ 'aria-hidden': true } as const);
  return (
    <span
      className={`mission-icon mission-icon--${state}`}
      style={style}
      {...a11y}
      dangerouslySetInnerHTML={{ __html: SOURCES[name] }}
    />
  );
}
