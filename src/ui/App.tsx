/**
 * @module ui/App
 *
 * Root application shell. Phase 6a scaffolds the layout; subsequent commits
 * mount the input panels, readout cards, and diagnostics onto it.
 */

import type { JSX } from 'react';

export function App(): JSX.Element {
  return (
    <main>
      <h1>Project Exogenesis</h1>
      <p>Set a world&rsquo;s conditions. Science determines its fate.</p>
    </main>
  );
}
