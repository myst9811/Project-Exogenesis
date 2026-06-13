/**
 * @module renderer/scene/planetRenderer
 *
 * The imperative Three.js scene (ADR-006): a framework-agnostic renderer
 * that consumes `PlanetShaderUniforms` and draws the world. It authors no
 * visual values of its own — every color, size, opacity, and spin comes from
 * the derivation layer, which derives them from `PlanetaryState` (CLAUDE.md
 * §8). The planet is a custom `ShaderMaterial`; on a shader-compile failure
 * it falls back to a solid `MeshStandardMaterial` so the viewport never
 * blanks.
 *
 * Render passes follow the §8 order via per-object `renderOrder`:
 *   1 space (starfield) → 2 stellar disk → 3 planet → 5 atmosphere shell.
 *
 * This module requires a WebGL context and is therefore excluded from unit
 * coverage (CLAUDE.md §11); it is verified by build and by running the app.
 */

import {
  AmbientLight,
  BackSide,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';

import type { PlanetShaderUniforms } from '../../types/render';
import { PLANET_FRAGMENT_SHADER, PLANET_VERTEX_SHADER } from './planetShaders';

/** A mounted renderer driving one canvas. */
export interface PlanetRenderer {
  /** Applies derived visual parameters to the scene. */
  setParameters: (uniforms: PlanetShaderUniforms) => void;
  /** Resizes the drawing buffer and camera to the given pixel size. */
  resize: (width: number, height: number) => void;
  /** Releases GPU resources and stops the animation loop. */
  dispose: () => void;
}

const STARFIELD_SEED = 0x9e_37_79_b9;
const STARFIELD_COUNT = 1500;
const STARFIELD_RADIUS = 400;
const PLANET_RADIUS_SCENE = 1;
const ATMOSPHERE_RADIUS_SCENE = 1.025;
const STAR_POSITION = new Vector3(-6, 1.5, -4);
/** World-space direction from the planet toward the star (for shader lighting). */
const LIGHT_DIR = STAR_POSITION.clone().normalize();

/**
 * Deterministic PRNG (mulberry32) for procedural geometry — never
 * Math.random, so the starfield is identical across runs (ADR-004).
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function buildStarfield(): Points {
  const random = mulberry32(STARFIELD_SEED);
  const positions = new Float32Array(STARFIELD_COUNT * 3);
  for (let i = 0; i < STARFIELD_COUNT; i++) {
    // Uniform points on a sphere via the inverse-cosine method.
    const u = random();
    const v = random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const sinPhi = Math.sin(phi);
    positions[i * 3] = STARFIELD_RADIUS * sinPhi * Math.cos(theta);
    positions[i * 3 + 1] = STARFIELD_RADIUS * sinPhi * Math.sin(theta);
    positions[i * 3 + 2] = STARFIELD_RADIUS * Math.cos(phi);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const material = new PointsMaterial({ color: 0xff_ff_ff, size: 0.7, sizeAttenuation: false });
  const points = new Points(geometry, material);
  points.renderOrder = 1; // §8 pass 1: space environment
  return points;
}

/**
 * Creates a renderer bound to a canvas and starts its animation loop.
 *
 * @param canvas - The canvas element to render into
 * @returns A {@link PlanetRenderer} handle
 */
export function createPlanetRenderer(canvas: HTMLCanvasElement): PlanetRenderer {
  const scene = new Scene();
  scene.background = new Color(0x02_03_08);

  const camera = new PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(0, 0, 3.2);

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;

  const starfield = buildStarfield();
  scene.add(starfield);

  // §8 pass 2: stellar disk — an unlit emissive sphere off to one side.
  const starMaterial = new MeshBasicMaterial({ color: 0xff_ff_ff });
  const star = new Mesh(new SphereGeometry(0.4, 32, 32), starMaterial);
  star.position.copy(STAR_POSITION);
  star.renderOrder = 2;
  scene.add(star);

  // The star also lights the planet, giving a day/night terminator.
  const sunlight = new DirectionalLight(0xff_ff_ff, 3);
  sunlight.position.copy(STAR_POSITION);
  scene.add(sunlight);
  scene.add(new AmbientLight(0xff_ff_ff, 0.05));

  // §8 pass 3: planet sphere — a custom shader, with a solid-color fallback.
  const planetUniforms = {
    uSurfaceColor: { value: new Color(1, 1, 1) },
    uStarColor: { value: new Color(1, 1, 1) },
    uIceFraction: { value: 0 },
    uMoltenFactor: { value: 0 },
    uLightDir: { value: LIGHT_DIR.clone() },
  };
  const shaderMaterial = new ShaderMaterial({
    vertexShader: PLANET_VERTEX_SHADER,
    fragmentShader: PLANET_FRAGMENT_SHADER,
    uniforms: planetUniforms,
  });
  const fallbackMaterial = new MeshStandardMaterial({ color: 0xff_ff_ff, roughness: 0.95 });
  const planet = new Mesh<SphereGeometry, ShaderMaterial | MeshStandardMaterial>(
    new SphereGeometry(PLANET_RADIUS_SCENE, 96, 96),
    shaderMaterial,
  );
  planet.renderOrder = 3;
  scene.add(planet);

  // If the planet shader fails to compile/link, swap to the solid fallback so
  // the viewport never blanks. Fires during render on the offending program.
  let planetUsesShader = true;
  const lastSurfaceColor = new Color(1, 1, 1);
  renderer.debug.onShaderError = (): void => {
    if (planetUsesShader) {
      planetUsesShader = false;
      fallbackMaterial.color.copy(lastSurfaceColor);
      planet.material = fallbackMaterial;
      // eslint-disable-next-line no-console
      console.error('[renderer] planet shader failed to compile; using solid fallback.');
    }
  };

  // §8 pass 5: atmosphere shell — a translucent back-side sphere for a limb glow.
  const atmosphereMaterial = new MeshBasicMaterial({
    color: 0xff_ff_ff,
    transparent: true,
    opacity: 0,
    side: BackSide,
    depthWrite: false,
  });
  const atmosphere = new Mesh(
    new SphereGeometry(ATMOSPHERE_RADIUS_SCENE, 64, 64),
    atmosphereMaterial,
  );
  atmosphere.renderOrder = 5;
  atmosphere.visible = false;
  scene.add(atmosphere);

  let animationHandle = 0;
  let previousTimestamp = 0;
  let currentSpin = 0;
  const renderLoop = (timestamp: number): void => {
    const delta = previousTimestamp === 0 ? 0 : (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    planet.rotation.y += delta * currentSpin;
    renderer.render(scene, camera);
    animationHandle = requestAnimationFrame(renderLoop);
  };
  animationHandle = requestAnimationFrame(renderLoop);

  return {
    setParameters: (uniforms: PlanetShaderUniforms): void => {
      lastSurfaceColor.setRGB(
        uniforms.surfaceColorRgb.r,
        uniforms.surfaceColorRgb.g,
        uniforms.surfaceColorRgb.b,
        SRGBColorSpace,
      );
      if (planetUsesShader) {
        planetUniforms.uSurfaceColor.value.setRGB(
          uniforms.surfaceColorRgb.r,
          uniforms.surfaceColorRgb.g,
          uniforms.surfaceColorRgb.b,
        );
        planetUniforms.uStarColor.value.setRGB(
          uniforms.starColorRgb.r,
          uniforms.starColorRgb.g,
          uniforms.starColorRgb.b,
        );
        planetUniforms.uIceFraction.value = uniforms.iceFraction;
        planetUniforms.uMoltenFactor.value = uniforms.moltenFactor;
      } else {
        fallbackMaterial.color.copy(lastSurfaceColor);
      }

      // Star: color + apparent size from the real angular radius.
      starMaterial.color.setRGB(
        uniforms.starColorRgb.r,
        uniforms.starColorRgb.g,
        uniforms.starColorRgb.b,
        SRGBColorSpace,
      );
      sunlight.color.setRGB(
        uniforms.starColorRgb.r,
        uniforms.starColorRgb.g,
        uniforms.starColorRgb.b,
        SRGBColorSpace,
      );
      const starScale = Math.max(0.15, Math.min(3, uniforms.starAngularRadius * 120));
      star.scale.setScalar(starScale);

      // Spin rate (sign sets prograde/retrograde).
      currentSpin = uniforms.spinRadiansPerSecond;

      // Atmosphere shell.
      atmosphere.visible = uniforms.atmospherePresent;
      atmosphereMaterial.opacity = uniforms.atmosphereThickness;
      atmosphereMaterial.color.setRGB(
        uniforms.skyColorRgb.r,
        uniforms.skyColorRgb.g,
        uniforms.skyColorRgb.b,
        SRGBColorSpace,
      );
    },
    resize: (width: number, height: number): void => {
      if (width <= 0 || height <= 0) {
        return;
      }
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose: (): void => {
      cancelAnimationFrame(animationHandle);
      starfield.geometry.dispose();
      (starfield.material as PointsMaterial).dispose();
      star.geometry.dispose();
      starMaterial.dispose();
      planet.geometry.dispose();
      shaderMaterial.dispose();
      fallbackMaterial.dispose();
      atmosphere.geometry.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();
    },
  };
}
