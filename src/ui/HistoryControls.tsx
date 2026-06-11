/**
 * @module ui/HistoryControls
 *
 * Undo/redo controls plus the live simulation status. Reads the history and
 * simulation stores reactively so the buttons enable and disable as the
 * timeline changes, and dispatches the coordinated undo/redo actions.
 */

import type { JSX } from 'react';

import { redoConfiguration, undoConfiguration } from '../store';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

export function HistoryControls(): JSX.Element {
  const stores = useStores();
  const history = useStore(stores.history);
  const simulation = useStore(stores.simulation);

  return (
    <div className="history-controls" role="toolbar" aria-label="history">
      <button
        type="button"
        disabled={history.past.length === 0}
        onClick={() => {
          void undoConfiguration(stores);
        }}
      >
        Undo
      </button>
      <button
        type="button"
        disabled={history.future.length === 0}
        onClick={() => {
          void redoConfiguration(stores);
        }}
      >
        Redo
      </button>
      <span className="sim-status" aria-label="status">
        {simulation.status}
      </span>
    </div>
  );
}
