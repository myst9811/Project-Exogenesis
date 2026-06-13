/**
 * @module ui/PlanetViewport.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
  it('feeds derived shader uniforms to the renderer for the computed world', async () => {
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
    const uniforms = setParameters.mock.calls[0]?.[0] as unknown;
    // The flat PlanetShaderUniforms bag, derived from real computed state.
    expect(uniforms).toMatchObject({
      surfaceColorRgb: expect.any(Object) as object,
      oceanLevel: expect.any(Number) as number,
      iceFraction: expect.any(Number) as number,
      starAngularRadius: expect.any(Number) as number,
      spinRadiansPerSecond: expect.any(Number) as number,
    });
  });

  it('shows the empty-deck overlay when no world is computed', () => {
    const { renderer } = fakeRenderer();
    render(
      <StoresProvider stores={createAppStores()}>
        <PlanetViewport createRenderer={() => renderer} />
      </StoresProvider>,
    );
    expect(screen.getByText('Configure a world to begin.')).not.toBeNull();
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
