/**
 * @module ui/StoresProvider
 *
 * React context carrying the application's stores (ADR-005). Components read
 * state reactively via {@link useStore} and dispatch through the store
 * actions; they never construct stores themselves, which keeps a single
 * instance per running app and makes tests inject their own.
 */

import { createContext, useContext } from 'react';
import type { JSX, ReactNode } from 'react';

import type { AppStores } from '../store';

const StoresContext = createContext<AppStores | null>(null);

export function StoresProvider({
  stores,
  children,
}: {
  stores: AppStores;
  children: ReactNode;
}): JSX.Element {
  return <StoresContext value={stores}>{children}</StoresContext>;
}

/**
 * Returns the application stores from context.
 *
 * @throws If called outside a {@link StoresProvider}.
 */
export function useStores(): AppStores {
  const stores = useContext(StoresContext);
  if (stores === null) {
    throw new Error('useStores must be used within a StoresProvider.');
  }
  return stores;
}
