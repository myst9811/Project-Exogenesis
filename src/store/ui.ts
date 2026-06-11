/**
 * @module store/ui
 *
 * UI-only state: display preferences and panel selection that shape how
 * computed values are presented, never what they are. This store holds no
 * physics inputs and imports nothing from `physics/`; it cannot influence
 * the simulation (CLAUDE.md §4). Physics inputs flow through the
 * simulation store instead.
 */

import { createStore, type Store } from './createStore';

/** Unit the UI displays temperatures in. */
export type TemperatureUnit = 'kelvin' | 'celsius' | 'fahrenheit';

/** Which input panel is currently expanded in the editor. */
export type InputPanel = 'stellar' | 'orbital' | 'planetary' | 'rotation' | 'atmosphere';

/** Display-only UI state. */
export interface UIState {
  temperatureUnit: TemperatureUnit;
  activePanel: InputPanel;
  /** Whether clearly-labeled AI speculation is shown (CLAUDE.md §7). */
  showSpeculative: boolean;
}

const INITIAL_UI_STATE: UIState = {
  temperatureUnit: 'celsius',
  activePanel: 'stellar',
  showSpeculative: false,
};

/** The UI store: a pub/sub store plus display-preference actions. */
export interface UIStore extends Store<UIState> {
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setActivePanel: (panel: InputPanel) => void;
  setShowSpeculative: (show: boolean) => void;
  toggleSpeculative: () => void;
}

/**
 * Creates the UI store.
 *
 * @param initialState - Optional starting state (defaults to sensible UI defaults)
 * @returns A {@link UIStore}
 */
export function createUIStore(initialState: UIState = INITIAL_UI_STATE): UIStore {
  const store = createStore<UIState>(initialState);

  return {
    ...store,
    setTemperatureUnit: (unit: TemperatureUnit): void => {
      store.setState((previous) => ({ ...previous, temperatureUnit: unit }));
    },
    setActivePanel: (panel: InputPanel): void => {
      store.setState((previous) => ({ ...previous, activePanel: panel }));
    },
    setShowSpeculative: (show: boolean): void => {
      store.setState((previous) => ({ ...previous, showSpeculative: show }));
    },
    toggleSpeculative: (): void => {
      store.setState((previous) => ({ ...previous, showSpeculative: !previous.showSpeculative }));
    },
  };
}
