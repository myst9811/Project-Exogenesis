/**
 * @module ui/SystemHeader
 *
 * The full-width console header: system identity (left), live system status
 * (center), and the undo/redo + share controls (right).
 */

import type { JSX } from 'react';

import { HistoryControls } from './HistoryControls';
import { ShareLink } from './ShareLink';
import { SystemStatus } from './SystemStatus';

export function SystemHeader(): JSX.Element {
  return (
    <header className="system-header">
      <div className="header-left">
        <span className="system-logo" aria-hidden="true">
          ◈
        </span>
        <div className="system-id">
          <h1 className="system-name">Project Exogenesis</h1>
          <div className="system-subtitle">Astrometric Simulation Console · v0.1.0</div>
        </div>
      </div>

      <div className="header-center">
        <SystemStatus />
      </div>

      <div className="header-right">
        <HistoryControls />
        <ShareLink />
      </div>
    </header>
  );
}
