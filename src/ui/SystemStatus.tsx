/**
 * @module ui/SystemStatus
 *
 * The console's system-status indicator: a pulsing dot plus the live
 * simulation status, mapped to a tactical readout (NOMINAL / COMPUTING /
 * FAULT). The machine-readable status string is exposed verbatim via the
 * `status` accessible name so it can be read programmatically.
 */

import type { JSX } from 'react';

import type { SimulationStatus } from '../store';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

const STATUS_LABEL: Record<SimulationStatus, string> = {
  idle: 'STANDBY',
  computing: 'COMPUTING',
  ready: 'ALL SYSTEMS NOMINAL',
  invalid: 'PARAMETER FAULT',
  error: 'ENGINE FAULT',
};

const STATUS_TONE: Record<SimulationStatus, string> = {
  idle: 'unknown',
  computing: 'caution',
  ready: 'nominal',
  invalid: 'critical',
  error: 'critical',
};

export function SystemStatus(): JSX.Element {
  const { simulation } = useStores();
  const status = useStore(simulation).status;

  return (
    <div className="system-status">
      <span className={`status-indicator status-${STATUS_TONE[status]}`} aria-hidden="true" />
      <span className="status-text" aria-label="status" data-status={status}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
