/**
 * @module ui/HistoryControls
 *
 * Undo/redo controls. Reads the history store reactively so the buttons
 * enable and disable as the timeline changes, and dispatches the coordinated
 * undo/redo actions. The live simulation status lives in {@link SystemStatus}.
 */

import type { JSX } from 'react';

import { redoConfiguration, undoConfiguration } from '../store';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

export function HistoryControls(): JSX.Element {
  const stores = useStores();
  const history = useStore(stores.history);

  return (
    <div className="history-controls" role="toolbar" aria-label="history">
      <button
        type="button"
        className="tactical-btn"
        disabled={history.past.length === 0}
        onClick={() => {
          void undoConfiguration(stores);
        }}
      >
        ↩ Undo
      </button>
      <button
        type="button"
        className="tactical-btn"
        disabled={history.future.length === 0}
        onClick={() => {
          void redoConfiguration(stores);
        }}
      >
        ↪ Redo
      </button>
    </div>
  );
}
