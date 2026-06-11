/**
 * @module ui/DiagnosticsList
 *
 * Surfaces the simulation's diagnostics (CLAUDE.md §19): validation errors
 * that blocked a computation and warnings about physically suspect inputs,
 * each with the explanation of why the combination is unusual. Renders
 * nothing when there are no diagnostics.
 */

import type { JSX } from 'react';

import { useStore } from './useStore';
import { useStores } from './StoresProvider';

export function DiagnosticsList(): JSX.Element | null {
  const { simulation } = useStores();
  const { diagnostics } = useStore(simulation);

  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <section className="diagnostics" aria-label="diagnostics">
      <ul>
        {diagnostics.map((diagnostic, index) => (
          <li
            key={`${diagnostic.parameter}-${index.toString()}`}
            className={`diagnostic diagnostic-${diagnostic.severity}`}
          >
            <strong className="diagnostic-severity">{diagnostic.severity}</strong>
            <span className="diagnostic-message">{diagnostic.message}</span>
            <span className="diagnostic-explanation">{diagnostic.explanation}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
