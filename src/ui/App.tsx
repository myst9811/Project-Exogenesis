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
import { InputPanels } from './InputPanels';
import { MissionIcon } from './MissionIcon';
import { NarrationPanel } from './NarrationPanel';
import { PlanetViewport, type PlanetRendererFactory } from './PlanetViewport';
import { StoresProvider } from './StoresProvider';
import { SystemHeader } from './SystemHeader';
import { WorldReadouts } from './WorldReadouts';
import { readWorldToken, writeWorldToken } from './worldUrl';

export function App({ createRenderer }: { createRenderer?: PlanetRendererFactory } = {}): JSX.Element {
  const [stores] = useState(createAppStores);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

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

  // Reflect every successfully computed world into the URL fragment, and
  // pulse the boot-scan line whenever the computed world changes.
  useEffect(() => {
    let previousHash: string | null = null;
    let scanTimer: ReturnType<typeof setTimeout> | undefined;
    const sync = (): void => {
      const state = stores.simulation.getState();
      if (state.status === 'ready' && state.planetaryState !== null) {
        const hash = state.planetaryState.configurationHash;
        if (previousHash !== null && previousHash !== hash) {
          setScanning(true);
          clearTimeout(scanTimer);
          scanTimer = setTimeout(() => {
            setScanning(false);
          }, 800);
        }
        previousHash = hash;
        if (state.configuration !== null) {
          writeWorldToken(encodeConfigurationToken(state.configuration));
        }
      }
    };
    const unsubscribe = stores.simulation.subscribe(sync);
    sync();
    return () => {
      unsubscribe();
      clearTimeout(scanTimer);
    };
  }, [stores]);

  return (
    <StoresProvider stores={stores}>
      <div className={scanning ? 'console scanning' : 'console'}>
        <div className="scan-indicator" aria-hidden="true">
          <MissionIcon name="rocket" size={16} state="active" />
        </div>
        <SystemHeader />
        {linkError !== null && (
          <p className="link-error" role="alert">
            {linkError} Showing the default world instead.
          </p>
        )}
        <main className="console-body">
          <section className="parameter-console" aria-label="parameters">
            <p className="console-thesis">
              Set a world&rsquo;s conditions. Science determines its fate.
            </p>
            <InputPanels />
            <DiagnosticsList />
          </section>
          <section className="visualization-console" aria-label="visualization">
            {createRenderer ? (
              <PlanetViewport createRenderer={createRenderer} />
            ) : (
              <PlanetViewport />
            )}
            <WorldReadouts />
            <NarrationPanel />
          </section>
        </main>
      </div>
    </StoresProvider>
  );
}
