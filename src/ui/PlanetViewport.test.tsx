/**
 * @module ui/PlanetViewport.test
 * @vitest-environment jsdom
 */

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { commitConfiguration, createAppStores, createDefaultConfiguration } from '../store';
import type { PlanetRenderer } from '../renderer/scene/planetRenderer';
import { PlanetViewport } from './PlanetViewport';
import { StoresProvider } from './StoresProvider';

afterEach(cleanup);

function fakeRenderer(): {
  renderer: PlanetRenderer;
  setParameters: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
} {
  const setParameters = vi.fn();
  const dispose = vi.fn();
  const renderer: PlanetRenderer = { setParameters, resize: vi.fn(), dispose };
  return { renderer, setParameters, dispose };
}

describe('PlanetViewport', () => {
  it('feeds derived render parameters to the renderer for the computed world', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    const { renderer, setParameters } = fakeRenderer();

    render(
      <StoresProvider stores={stores}>
        <PlanetViewport createRenderer={() => renderer} />
      </StoresProvider>,
    );

    await waitFor(() => {
      expect(setParameters).toHaveBeenCalled();
    });
    const params = setParameters.mock.calls[0]?.[0] as unknown;
    expect(params).toMatchObject({
      star: expect.any(Object) as object,
      planet: expect.any(Object) as object,
      atmosphere: expect.any(Object) as object,
    });
  });

  it('disposes the renderer on unmount', () => {
    const { renderer, dispose } = fakeRenderer();
    const { unmount } = render(
      <StoresProvider stores={createAppStores()}>
        <PlanetViewport createRenderer={() => renderer} />
      </StoresProvider>,
    );
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
