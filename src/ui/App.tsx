/**
 * @module ui/App
 *
 * Root application shell. Creates the application stores once; on mount it
 * loads a shared world from the URL fragment if present, otherwise seeds the
 * default world; thereafter it reflects every computed world back into the
 * URL so the address bar is always a shareable link (ADR-007). Composes the
 * editor: input panels, the 3D viewport, felt-experience readouts, AI
 * narration, diagnostics, and history controls.
 */

import { useEffect, useState } from 'react';
import type { JSX } from 'react';

import {
  commitConfiguration,
  createAppStores,
  createDefaultConfiguration,
  encodeConfigurationToken,
  loadConfigurationToken,
} from '../store';
import { DiagnosticsList } from './DiagnosticsList';
import { HistoryControls } from './HistoryControls';
import { InputPanels } from './InputPanels';
import { NarrationPanel } from './NarrationPanel';
import { PlanetViewport, type PlanetRendererFactory } from './PlanetViewport';
import { ShareLink } from './ShareLink';
import { StoresProvider } from './StoresProvider';
import { WorldReadouts } from './WorldReadouts';
import { readWorldToken, writeWorldToken } from './worldUrl';

export function App({ createRenderer }: { createRenderer?: PlanetRendererFactory } = {}): JSX.Element {
  const [stores] = useState(createAppStores);
  const [linkError, setLinkError] = useState<string | null>(null);

  // On mount: load a shared world from the URL, else seed the default.
  // `active.value` is read across awaits; a holder object avoids the flow
  // narrowing that a plain `let` flag would trigger.
  useEffect(() => {
    const active = { value: true };
    void (async () => {
      const token = readWorldToken();
      if (token !== null) {
        const diagnostics = await loadConfigurationToken(stores, token);
        if (!active.value) {
          return;
        }
        if (diagnostics.length === 0) {
          return;
        }
        setLinkError(diagnostics[0]?.message ?? 'The shared link could not be loaded.');
      }
      if (active.value) {
        await commitConfiguration(stores, createDefaultConfiguration());
      }
    })();
    return () => {
      active.value = false;
    };
  }, [stores]);

  // Reflect every successfully computed world into the URL fragment.
  useEffect(() => {
    const sync = (): void => {
      const state = stores.simulation.getState();
      if (state.status === 'ready' && state.configuration !== null) {
        writeWorldToken(encodeConfigurationToken(state.configuration));
      }
    };
    const unsubscribe = stores.simulation.subscribe(sync);
    sync();
    return unsubscribe;
  }, [stores]);

  return (
    <StoresProvider stores={stores}>
      <main className="app">
        <header className="app-header">
          <h1>Project Exogenesis</h1>
          <p>Set a world&rsquo;s conditions. Science determines its fate.</p>
          <HistoryControls />
          <ShareLink />
          {linkError !== null && (
            <p className="link-error" role="alert">
              {linkError} Showing the default world instead.
            </p>
          )}
        </header>
        <div className="app-body">
          <InputPanels />
          <div className="app-view">
            {createRenderer ? <PlanetViewport createRenderer={createRenderer} /> : <PlanetViewport />}
            <WorldReadouts />
            <NarrationPanel />
          </div>
        </div>
        <DiagnosticsList />
      </main>
    </StoresProvider>
  );
}
