/**
 * @module ui/App
 *
 * Root application shell. Creates the application stores once, seeds the
 * default world on mount, and composes the editor: input panels, the
 * felt-experience readouts, diagnostics, and history controls. The 3D
 * renderer mounts here in Phase 6b.
 */

import { useEffect, useState } from 'react';
import type { JSX } from 'react';

import { commitConfiguration, createAppStores, createDefaultConfiguration } from '../store';
import { DiagnosticsList } from './DiagnosticsList';
import { HistoryControls } from './HistoryControls';
import { InputPanels } from './InputPanels';
import { StoresProvider } from './StoresProvider';
import { WorldReadouts } from './WorldReadouts';

export function App(): JSX.Element {
  const [stores] = useState(createAppStores);

  // Seed the default world once, so the app opens on a computed Earth.
  useEffect(() => {
    void commitConfiguration(stores, createDefaultConfiguration());
  }, [stores]);

  return (
    <StoresProvider stores={stores}>
      <main className="app">
        <header className="app-header">
          <h1>Project Exogenesis</h1>
          <p>Set a world&rsquo;s conditions. Science determines its fate.</p>
          <HistoryControls />
        </header>
        <div className="app-body">
          <InputPanels />
          <WorldReadouts />
        </div>
        <DiagnosticsList />
      </main>
    </StoresProvider>
  );
}
