/**
 * @module ui/TacticalPanel
 *
 * The console's subsystem frame: a bordered panel with corner brackets, a
 * subsystem eyebrow, a title, and a pulsing status dot. Used to group the
 * parameter inputs and other console sections.
 */

import type { JSX, ReactNode } from 'react';

export function TacticalPanel({
  eyebrow,
  title,
  index = 0,
  children,
}: {
  eyebrow: string;
  title: string;
  index?: number;
  children: ReactNode;
}): JSX.Element {
  return (
    <section
      className="tactical-panel"
      style={{ ['--panel-index' as string]: String(index) }}
    >
      <div className="panel-header">
        <span className="panel-eyebrow">{eyebrow}</span>
        <span className="panel-title">{title}</span>
        <span className="panel-status-dot" aria-hidden="true" />
      </div>
      <div className="panel-content">{children}</div>
    </section>
  );
}
