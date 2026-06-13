/**
 * @module ui/PlanetViewport
 *
 * Mounts the Three.js renderer into a canvas and feeds it derived
 * `RenderParameters` whenever the world changes. The renderer factory is
 * injectable (defaulting to the real WebGL renderer) so the wiring can be
 * tested without a GL context, which jsdom does not provide.
 */

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';

import { deriveShaderUniforms } from '../renderer/shaderUniforms';
import { createPlanetRenderer } from '../renderer/scene/planetRenderer';
import type { PlanetRenderer } from '../renderer/scene/planetRenderer';
import { MissionIcon } from './MissionIcon';
import { ModeRail } from './ModeRail';
import { ViewportHud } from './ViewportHud';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

export type PlanetRendererFactory = (canvas: HTMLCanvasElement) => PlanetRenderer;

export function PlanetViewport({
  createRenderer = createPlanetRenderer,
}: {
  createRenderer?: PlanetRendererFactory;
}): JSX.Element {
  const { simulation } = useStores();
  const state = useStore(simulation);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PlanetRenderer | null>(null);

  // Create the renderer once, on mount; dispose it on unmount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return undefined;
    }
    const renderer = createRenderer(canvas);
    rendererRef.current = renderer;
    const handleResize = (): void => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [createRenderer]);

  // Push derived shader uniforms whenever the computed world changes.
  const world = state.planetaryState;
  const liquidWater = state.habitability?.liquidWater ?? null;
  useEffect(() => {
    if (world !== null && liquidWater !== null && rendererRef.current !== null) {
      rendererRef.current.setParameters(deriveShaderUniforms(world, liquidWater));
    }
  }, [world, liquidWater]);

  return (
    <div className="viewport-frame">
      <canvas ref={canvasRef} className="planet-viewport" aria-label="planet view" />
      <ModeRail />
      <ViewportHud />
      {world === null && (
        <div className="viewport-empty">
          <MissionIcon name="cockpit" size={72} state="idle" />
          <p>Configure a world to begin.</p>
        </div>
      )}
    </div>
  );
}
