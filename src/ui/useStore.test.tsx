/**
 * @module ui/useStore.test
 * @vitest-environment jsdom
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { createStore } from '../store';
import { useStore } from './useStore';

afterEach(cleanup);

describe('useStore', () => {
  it('renders the current store state', () => {
    const store = createStore({ count: 7 });
    function Probe(): JSX.Element {
      const state = useStore(store);
      return <output>{state.count}</output>;
    }
    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('7');
  });

  it('re-renders when the store state changes', () => {
    const store = createStore({ count: 0 });
    function Probe(): JSX.Element {
      const state = useStore(store);
      return <output>{state.count}</output>;
    }
    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('0');
    act(() => {
      store.setState({ count: 42 });
    });
    expect(screen.getByRole('status').textContent).toBe('42');
  });
});
