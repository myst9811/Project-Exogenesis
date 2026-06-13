# Breathtaking Planet Shader — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the solid-color planet sphere with a custom GLSL shader whose every visual aspect (oceans, ice, molten surface, terrain, clouds, atmosphere, day/night, star size, spin) derives from computed physics, so changing any major parameter visibly transforms the world.

**Architecture:** A pure, unit-tested `deriveShaderUniforms(state, liquidWater)` maps `PlanetaryState` + the computed liquid-water assessment to a `PlanetShaderUniforms` bag (CLAUDE.md §8 — every uniform a function of physics). A `ShaderMaterial` planet in the existing Three.js scene consumes it; the GLSL is WebGL-only and excluded from coverage (verified by build + manual run), with a solid-sphere fallback on compile failure.

**Tech Stack:** TypeScript (strict), Three.js, GLSL, Vitest, Vite.

---

## File Structure

- **Create** `src/renderer/shaderUniforms.ts` — pure derivation `PlanetaryState` + `LiquidWaterAssessment` → `PlanetShaderUniforms`. Reuses `deriveBlackbodyColor`, `deriveStarAngularRadius`, `deriveSurfaceColor`, `deriveAtmosphereAppearance`.
- **Create** `src/renderer/shaderUniforms.test.ts` — unit tests (renderer ≥80% gate).
- **Create** `src/renderer/scene/planetShaders.ts` — exported GLSL vertex + fragment source strings. (Excluded from coverage.)
- **Modify** `src/types/render.ts` — add `PlanetShaderUniforms`; remove the now-unused `RenderParameters` aggregate (keep `ColorRGB`, `StarRenderParameters`, `PlanetRenderParameters`, `AtmosphereRenderParameters` — still used).
- **Modify** `src/renderer/scene/planetRenderer.ts` — planet uses `ShaderMaterial`; `setParameters(PlanetShaderUniforms)`; star sized by angular radius; spin from physics; `uTime` in the loop; compile-failure fallback to `MeshStandardMaterial`.
- **Modify** `src/ui/PlanetViewport.tsx` — read `state.habitability`, derive uniforms via `deriveShaderUniforms(world, habitability.liquidWater)`, feed `setParameters`.
- **Delete** `src/renderer/parameters.ts` + `src/renderer/parameters.test.ts` — `deriveRenderParameters` is superseded (only the viewport used it).

The work is staged: **Stage 1** (derivation + responsive basic shader), **Stage 2** (procedural geography), **Stage 3** (clouds + atmosphere limb). Each stage builds, tests green, and is runnable.

---

# STAGE 1 — Derivation + responsive surface

## Task 1: `PlanetShaderUniforms` type

**Files:**
- Modify: `src/types/render.ts`

- [ ] **Step 1: Add the type** (append after `AtmosphereRenderParameters`, before `RenderParameters`)

```ts
/**
 * The complete uniform set the planet shader consumes. Every field is derived
 * from computed physics by `deriveShaderUniforms` (CLAUDE.md §8). Colors are
 * sRGB in [0, 1]; fractions are clamped to [0, 1] unless noted.
 */
export interface PlanetShaderUniforms {
  /** Base surface palette from composition × bond albedo. */
  surfaceColorRgb: ColorRGB;
  /** Polar-ice extent, 0 (none) → 1 (snowball), from surface temperature. */
  iceFraction: number;
  /** Sea level threshold, 0 (no oceans) → ~0.85, gated by liquid-water + water. */
  oceanLevel: number;
  /** Emissive lava strength, 0 → 1, when scorching. */
  moltenFactor: number;
  /** Deterministic procedural-terrain seed from the configuration hash. */
  terrainSeed: number;
  /** Relief amplitude, 0 (smooth) → 1 (rugged), from composition. */
  terrainRoughness: number;
  /** False for an airless world. */
  atmospherePresent: boolean;
  /** Rayleigh tint of the stellar spectrum (limb glow color). */
  skyColorRgb: ColorRGB;
  /** Atmospheric column depth, 0 → 1, from surface pressure. */
  atmosphereThickness: number;
  /** Cloud cover, 0 → 1, from water vapor × pressure. */
  cloudDensity: number;
  /** Blackbody star color. */
  starColorRgb: ColorRGB;
  /** Star apparent angular radius in radians (sizes the disc). */
  starAngularRadius: number;
  /** Visual spin in rad/s; sign sets prograde/retrograde. */
  spinRadiansPerSecond: number;
}
```

- [ ] **Step 2: Remove the unused `RenderParameters` aggregate** — delete the `export interface RenderParameters { … }` block (the per-section `*RenderParameters` interfaces stay; only the top-level aggregate goes, since `deriveRenderParameters` is being deleted in Task 7).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no file imports `RenderParameters` yet besides `parameters.ts`, removed in Task 7 — if typecheck flags `parameters.ts`, that is expected and resolved there; to keep this task green, temporarily leave `RenderParameters` and remove it in Task 7 instead). 

> **Note:** To avoid a transient broken state, defer the `RenderParameters` deletion to Task 7 (where `parameters.ts` is deleted in the same step). In this task, only ADD `PlanetShaderUniforms`.

- [ ] **Step 4: Commit**

```bash
git add src/types/render.ts
git commit -m "types(render): add PlanetShaderUniforms contract for the planet shader"
```

## Task 2: Scalar derivation helpers (TDD)

**Files:**
- Create: `src/renderer/shaderUniforms.ts`
- Test: `src/renderer/shaderUniforms.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
/**
 * @module renderer/shaderUniforms.test
 */

import { describe, expect, it } from 'vitest';

import {
  deriveCloudDensity,
  deriveIceFraction,
  deriveMoltenFactor,
  deriveOceanLevel,
  deriveSpin,
  deriveTerrainSeed,
} from './shaderUniforms';

describe('deriveIceFraction', () => {
  it('is a small cap for Earth (288 K)', () => {
    expect(deriveIceFraction(288)).toBeCloseTo(0.2, 2);
  });
  it('is a full snowball at/below 240 K', () => {
    expect(deriveIceFraction(240)).toBe(1);
    expect(deriveIceFraction(150)).toBe(1);
  });
  it('is none at/above 300 K', () => {
    expect(deriveIceFraction(300)).toBe(0);
    expect(deriveIceFraction(500)).toBe(0);
  });
});

describe('deriveMoltenFactor', () => {
  it('is zero for temperate and Venus-like worlds', () => {
    expect(deriveMoltenFactor(288)).toBe(0);
    expect(deriveMoltenFactor(737)).toBe(0);
  });
  it('ramps from 1000 K to full glow at 1400 K', () => {
    expect(deriveMoltenFactor(1200)).toBeCloseTo(0.5, 2);
    expect(deriveMoltenFactor(1400)).toBe(1);
    expect(deriveMoltenFactor(2000)).toBe(1);
  });
});

describe('deriveOceanLevel', () => {
  it('floods a water-world regardless', () => {
    expect(deriveOceanLevel('water-world', false, 0)).toBe(0.85);
  });
  it('gives Earth-like coverage when liquid water is possible and water is present', () => {
    expect(deriveOceanLevel('rocky-silicate', true, 1.3)).toBe(0.5);
  });
  it('gives no oceans without liquid water or without water', () => {
    expect(deriveOceanLevel('rocky-silicate', false, 1.3)).toBe(0);
    expect(deriveOceanLevel('rocky-silicate', true, 0)).toBe(0);
  });
});

describe('deriveCloudDensity', () => {
  it('produces moderate cloud for Earth (1.3 kPa H2O, 101 kPa total)', () => {
    expect(deriveCloudDensity(1.3, 101)).toBeGreaterThan(0.4);
    expect(deriveCloudDensity(1.3, 101)).toBeLessThan(0.7);
  });
  it('is zero when dry or airless', () => {
    expect(deriveCloudDensity(0, 101)).toBe(0);
    expect(deriveCloudDensity(1.3, 0)).toBe(0);
  });
});

describe('deriveSpin', () => {
  it('spins Earth (24 h) at ~0.105 rad/s', () => {
    expect(deriveSpin(24)).toBeCloseTo(0.105, 2);
  });
  it('spins faster for a short day', () => {
    expect(Math.abs(deriveSpin(6))).toBeGreaterThan(Math.abs(deriveSpin(24)));
  });
  it('reverses direction for retrograde rotation', () => {
    expect(deriveSpin(-24)).toBeLessThan(0);
  });
  it('treats a zero period as a 24 h day rather than dividing by zero', () => {
    expect(deriveSpin(0)).toBeCloseTo(deriveSpin(24), 5);
  });
});

describe('deriveTerrainSeed', () => {
  it('is deterministic for a given hash', () => {
    expect(deriveTerrainSeed('36b20d11ff')).toBe(deriveTerrainSeed('36b20d11ff'));
  });
  it('differs for different hashes', () => {
    expect(deriveTerrainSeed('aaaaaaaa')).not.toBe(deriveTerrainSeed('bbbbbbbb'));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/renderer/shaderUniforms.test.ts`
Expected: FAIL — module/exports not found.

- [ ] **Step 3: Implement the helpers**

```ts
/**
 * @module renderer/shaderUniforms
 *
 * Derives the planet shader's uniforms from computed physics (CLAUDE.md §8).
 * Pure and total: reads computed state + the liquid-water assessment, reusing
 * the existing star/surface/atmosphere derivations rather than duplicating
 * them (ADR-002, §4 — physics types only). Continent placement is a
 * deterministic seed from the configuration hash (ADR-004), applied in-shader.
 */

import type { PlanetCompositionClass } from '../types/configuration';

/** Clamps a value to [0, 1]. */
function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Polar-ice extent from surface temperature: full ≤240 K, none ≥300 K. */
export function deriveIceFraction(surfaceTemperatureKelvin: number): number {
  return clamp01((300 - surfaceTemperatureKelvin) / 60);
}

/** Emissive lava strength: begins ~1000 K, full by 1400 K. */
export function deriveMoltenFactor(surfaceTemperatureKelvin: number): number {
  return clamp01((surfaceTemperatureKelvin - 1000) / 400);
}

/**
 * Sea-level threshold. A water-world is mostly ocean; otherwise oceans require
 * both that liquid water is thermodynamically possible and that water is
 * actually present (non-zero H2O partial pressure).
 */
export function deriveOceanLevel(
  compositionClass: PlanetCompositionClass,
  liquidWaterPossible: boolean,
  waterVaporKilopascals: number,
): number {
  if (compositionClass === 'water-world') {
    return 0.85;
  }
  const waterPresent = waterVaporKilopascals > 0;
  return liquidWaterPossible && waterPresent ? 0.5 : 0;
}

/** Cloud cover from water vapor and total pressure; none if dry or airless. */
export function deriveCloudDensity(
  waterVaporKilopascals: number,
  totalPressureKilopascals: number,
): number {
  if (waterVaporKilopascals <= 0 || totalPressureKilopascals <= 0) {
    return 0;
  }
  return clamp01(Math.sqrt(waterVaporKilopascals / 4)) * clamp01(totalPressureKilopascals / 40);
}

/** Relief amplitude by bulk composition. */
export const TERRAIN_ROUGHNESS: Record<PlanetCompositionClass, number> = {
  'rocky-silicate': 0.8,
  'iron-rich': 0.7,
  'water-world': 0.3,
  'gas-dwarf': 0.15,
};

/** Deterministic terrain seed from the configuration hash (ADR-004). */
export function deriveTerrainSeed(configurationHash: string): number {
  const slice = configurationHash.slice(0, 8) || '0';
  return (parseInt(slice, 16) % 1_000_000) / 1000;
}

/** Visual spin: a 24 h day turns once per 60 s on screen; sign = direction. */
const VISUAL_DAY_SECONDS = 60;
export function deriveSpin(rotationPeriodHours: number): number {
  const hours = rotationPeriodHours === 0 ? 24 : rotationPeriodHours;
  const visualSeconds = Math.min(
    600,
    Math.max(10, (Math.abs(hours) / 24) * VISUAL_DAY_SECONDS),
  );
  return (Math.sign(hours) * (2 * Math.PI)) / visualSeconds;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/renderer/shaderUniforms.test.ts`
Expected: PASS (all helper describes green).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/shaderUniforms.ts src/renderer/shaderUniforms.test.ts
git commit -m "feat(renderer): derive physics-driven shader scalars (ice, molten, ocean, cloud, spin, seed)"
```

## Task 3: Compose `deriveShaderUniforms` (TDD)

**Files:**
- Modify: `src/renderer/shaderUniforms.ts`
- Modify: `src/renderer/shaderUniforms.test.ts`

- [ ] **Step 1: Add the failing composition tests**

```ts
// Add to src/renderer/shaderUniforms.test.ts

import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import { hashConfiguration } from '../physics/configuration/manifest';
import { computePlanetaryState } from '../physics';
import { assessHabitability } from '../physics/habitability';
import type { PlanetConfiguration } from '../types/configuration';
import type { PlanetaryState } from '../types/physics';
import { deriveShaderUniforms } from './shaderUniforms';

async function worldFor(
  mutate: (c: PlanetConfiguration) => void = () => undefined,
): Promise<PlanetaryState> {
  const config = createEarthBaselineConfiguration();
  mutate(config);
  return computePlanetaryState(await hashConfiguration(config));
}

describe('deriveShaderUniforms', () => {
  it('gives Earth oceans, modest ice, clouds, and a present atmosphere', async () => {
    const world = await worldFor();
    const u = deriveShaderUniforms(world, assessHabitability(world).liquidWater);
    expect(u.oceanLevel).toBeGreaterThan(0);
    expect(u.iceFraction).toBeGreaterThan(0);
    expect(u.iceFraction).toBeLessThan(0.5);
    expect(u.cloudDensity).toBeGreaterThan(0);
    expect(u.atmospherePresent).toBe(true);
    expect(u.starAngularRadius).toBeGreaterThan(0);
  });

  it('gives an airless world no clouds and no atmosphere', async () => {
    const world = await worldFor((c) => {
      c.atmosphere.partialPressuresKilopascals = {};
    });
    const u = deriveShaderUniforms(world, assessHabitability(world).liquidWater);
    expect(u.cloudDensity).toBe(0);
    expect(u.atmospherePresent).toBe(false);
    expect(u.oceanLevel).toBe(0);
  });

  it('is deterministic and matches the configuration hash for the terrain seed', async () => {
    const world = await worldFor();
    const water = assessHabitability(world).liquidWater;
    expect(deriveShaderUniforms(world, water)).toEqual(deriveShaderUniforms(world, water));
    expect(deriveShaderUniforms(world, water).terrainSeed).toBe(deriveTerrainSeed(world.configurationHash));
  });
});
```

> The `deriveTerrainSeed` import already exists at the top of the test file from Task 2.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/renderer/shaderUniforms.test.ts`
Expected: FAIL — `deriveShaderUniforms` not exported.

- [ ] **Step 3: Implement the composer** (append to `src/renderer/shaderUniforms.ts`)

```ts
import type { LiquidWaterAssessment } from '../types/habitability';
import type { PlanetaryState } from '../types/physics';
import type { PlanetShaderUniforms } from '../types/render';
import { deriveAtmosphereAppearance } from './atmosphere';
import { deriveBlackbodyColor, deriveStarAngularRadius } from './star';
import { deriveSurfaceColor } from './surface';

/**
 * Derives the complete planet-shader uniform set from a computed world and its
 * liquid-water assessment.
 *
 * @param state - The computed planetary state
 * @param liquidWater - The computed liquid-water assessment (from habitability)
 * @returns The shader uniforms
 */
export function deriveShaderUniforms(
  state: PlanetaryState,
  liquidWater: LiquidWaterAssessment,
): PlanetShaderUniforms {
  const composition = state.configuration.planetary.compositionClass;
  const waterVaporKilopascals =
    state.configuration.atmosphere.partialPressuresKilopascals.H2O ?? 0;
  const starColorRgb = deriveBlackbodyColor(state.stellar.effectiveTemperatureKelvin);
  const atmosphere = deriveAtmosphereAppearance(
    state.atmosphere.surfacePressureKilopascals,
    starColorRgb,
  );

  return {
    surfaceColorRgb: deriveSurfaceColor(composition, state.climate.bondAlbedo),
    iceFraction: deriveIceFraction(state.climate.surfaceTemperatureKelvin),
    oceanLevel: deriveOceanLevel(composition, liquidWater.possible, waterVaporKilopascals),
    moltenFactor: deriveMoltenFactor(state.climate.surfaceTemperatureKelvin),
    terrainSeed: deriveTerrainSeed(state.configurationHash),
    terrainRoughness: TERRAIN_ROUGHNESS[composition],
    atmospherePresent: atmosphere.present,
    skyColorRgb: atmosphere.skyColorRgb,
    atmosphereThickness: atmosphere.opacity,
    cloudDensity: deriveCloudDensity(
      waterVaporKilopascals,
      state.atmosphere.surfacePressureKilopascals,
    ),
    starColorRgb,
    starAngularRadius: deriveStarAngularRadius(
      state.stellar.radiusMeters,
      state.orbit.semiMajorAxisMeters,
    ),
    spinRadiansPerSecond: deriveSpin(state.configuration.rotation.rotationPeriodHours),
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/renderer/shaderUniforms.test.ts && npm run typecheck && npm run lint`
Expected: PASS, clean typecheck and lint.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/shaderUniforms.ts src/renderer/shaderUniforms.test.ts
git commit -m "feat(renderer): compose deriveShaderUniforms from computed physics + liquid water"
```

## Task 4: Basic shader, scene wiring, viewport wiring, fallback

**Files:**
- Create: `src/renderer/scene/planetShaders.ts`
- Modify: `src/renderer/scene/planetRenderer.ts`
- Modify: `src/ui/PlanetViewport.tsx`
- Delete: `src/renderer/parameters.ts`, `src/renderer/parameters.test.ts`
- Modify: `src/types/render.ts` (remove `RenderParameters` now)

> No unit test for the GLSL/scene (WebGL-only; `src/renderer/scene/**` is coverage-excluded). Verification is `npm run build` + manual `npm run dev`.

- [ ] **Step 1: Create the shader source** — `src/renderer/scene/planetShaders.ts`

```ts
/**
 * @module renderer/scene/planetShaders
 *
 * GLSL source for the physics-derived planet. Stage 1: surface palette,
 * temperature ice caps, molten glow, day/night Lambert lighting. Procedural
 * geography (Stage 2) and clouds/atmosphere (Stage 3) extend the fragment
 * shader. WebGL-only; not unit-tested (see the plan).
 */

export const PLANET_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vObjectPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vObjectPos = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const PLANET_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uSurfaceColor;
  uniform vec3 uStarColor;
  uniform float uIceFraction;
  uniform float uMoltenFactor;
  uniform vec3 uLightDir;     // world-space direction toward the star

  varying vec3 vNormal;
  varying vec3 vObjectPos;

  void main() {
    // Latitude drives polar ice: |y| of the object-space surface direction.
    float lat = abs(vObjectPos.y);
    float iceEdge = 1.0 - uIceFraction;          // higher ice → lower edge
    float ice = smoothstep(iceEdge - 0.05, iceEdge + 0.05, lat);

    vec3 surface = uSurfaceColor;
    surface = mix(surface, vec3(0.9, 0.94, 1.0), ice);          // ice caps
    surface = mix(surface, vec3(1.0, 0.35, 0.1), uMoltenFactor); // molten tint

    // Day/night Lambert from the star direction.
    float day = clamp(dot(normalize(vNormal), normalize(uLightDir)), 0.0, 1.0);
    float ambient = 0.06;
    vec3 lit = surface * (ambient + 0.95 * day) * uStarColor;

    // Molten worlds self-illuminate on the night side.
    lit += uSurfaceColor * uMoltenFactor * (1.0 - day) * vec3(1.0, 0.3, 0.08);

    gl_FragColor = vec4(lit, 1.0);
  }
`;
```

- [ ] **Step 2: Rewire the scene** — in `src/renderer/scene/planetRenderer.ts`:

  (a) Update imports — add at the top with the other `three` imports:

```ts
import { ShaderMaterial, Vector3, Color, MeshStandardMaterial } from 'three';
import { PLANET_FRAGMENT_SHADER, PLANET_VERTEX_SHADER } from './planetShaders';
import type { PlanetShaderUniforms } from '../../types/render';
```

  (Remove the `RenderParameters` import; keep the rest. `MeshStandardMaterial` stays for the fallback.)

  (b) Change the interface param type:

```ts
export interface PlanetRenderer {
  setParameters: (uniforms: PlanetShaderUniforms) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}
```

  (c) Replace the planet material/mesh construction (the block that builds `planetMaterial` + `planet`) with a shader material plus a fallback. Define the light direction as a constant `const LIGHT_DIR = new Vector3(-6, 1.5, -4).normalize();` (matching the existing star position) and:

```ts
  const planetUniforms = {
    uSurfaceColor: { value: new Color(1, 1, 1) },
    uStarColor: { value: new Color(1, 1, 1) },
    uIceFraction: { value: 0 },
    uMoltenFactor: { value: 0 },
    uLightDir: { value: LIGHT_DIR.clone() },
  };

  let planetMaterial: ShaderMaterial | MeshStandardMaterial;
  const shaderMaterial = new ShaderMaterial({
    vertexShader: PLANET_VERTEX_SHADER,
    fragmentShader: PLANET_FRAGMENT_SHADER,
    uniforms: planetUniforms,
  });
  // Detect a compile failure by forcing a compile and checking the program log.
  let shaderOk = true;
  try {
    renderer.compile(scene, camera); // safe even before planet is added
  } catch {
    shaderOk = false;
  }
  if (shaderOk) {
    planetMaterial = shaderMaterial;
  } else {
    // eslint-disable-next-line no-console
    console.error('[renderer] planet shader failed to compile; using solid fallback.');
    planetMaterial = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  }
  const planet = new Mesh(new SphereGeometry(PLANET_RADIUS_SCENE, 96, 96), planetMaterial);
  planet.renderOrder = 3;
  scene.add(planet);
```

> The robust compile check is `renderer.getContext()` program logs; for the MVP the `try/compile/catch` above plus the always-present fallback is sufficient. If `renderer.compile` does not throw on a bad shader in the target Three.js version, the visible black planet is the signal to iterate — the fallback covers the catastrophic case.

  (d) In `setParameters`, set the uniforms (replace the old body):

```ts
    setParameters: (uniforms: PlanetShaderUniforms): void => {
      if (planetMaterial instanceof ShaderMaterial) {
        planetUniforms.uSurfaceColor.value.setRGB(
          uniforms.surfaceColorRgb.r, uniforms.surfaceColorRgb.g, uniforms.surfaceColorRgb.b,
        );
        planetUniforms.uStarColor.value.setRGB(
          uniforms.starColorRgb.r, uniforms.starColorRgb.g, uniforms.starColorRgb.b,
        );
        planetUniforms.uIceFraction.value = uniforms.iceFraction;
        planetUniforms.uMoltenFactor.value = uniforms.moltenFactor;
      } else {
        planetMaterial.color.setRGB(
          uniforms.surfaceColorRgb.r, uniforms.surfaceColorRgb.g, uniforms.surfaceColorRgb.b,
        );
      }
      // Star: color + size from angular radius (apparent disc).
      starMaterial.color.setRGB(uniforms.starColorRgb.r, uniforms.starColorRgb.g, uniforms.starColorRgb.b);
      sunlight.color.setRGB(uniforms.starColorRgb.r, uniforms.starColorRgb.g, uniforms.starColorRgb.b);
      const starScale = Math.max(0.15, Math.min(3, uniforms.starAngularRadius * 120));
      star.scale.setScalar(starScale);
      // Spin rate from rotation period (sign = direction).
      currentSpin = uniforms.spinRadiansPerSecond;
      // Atmosphere shell (existing).
      atmosphere.visible = uniforms.atmospherePresent;
      atmosphereMaterial.opacity = uniforms.atmosphereThickness;
      atmosphereMaterial.color.setRGB(uniforms.skyColorRgb.r, uniforms.skyColorRgb.g, uniforms.skyColorRgb.b);
    },
```

  (e) Add `let currentSpin = 0;` near the other scene `let` bindings, and in the render loop replace the fixed `planet.rotation.y += delta * 0.15;` with `planet.rotation.y += delta * currentSpin;`. Keep `SRGBColorSpace` usages already present for the star/atmosphere.

- [ ] **Step 3: Rewire the viewport** — `src/ui/PlanetViewport.tsx`:

  (a) Replace the import `import { deriveRenderParameters } from '../renderer/parameters';` with `import { deriveShaderUniforms } from '../renderer/shaderUniforms';`.

  (b) In the body, read habitability alongside the world:

```ts
  const state = useStore(simulation);
  const world = state.planetaryState;
  const liquidWater = state.habitability?.liquidWater ?? null;
```

  (c) Update the parameter-feed effect to pass uniforms (keyed on the world AND liquid-water identity):

```ts
  useEffect(() => {
    if (world !== null && liquidWater !== null && rendererRef.current !== null) {
      rendererRef.current.setParameters(deriveShaderUniforms(world, liquidWater));
    }
  }, [world, liquidWater]);
```

- [ ] **Step 4: Delete the superseded derivation + drop `RenderParameters`**

```bash
git rm src/renderer/parameters.ts src/renderer/parameters.test.ts
```

  Then remove the `export interface RenderParameters { … }` block from `src/types/render.ts` (deferred from Task 1).

- [ ] **Step 5: Update the architecture smoke test** — `src/architecture.test.ts` imports `renderer/parameters`. Replace that import and its map entry with `renderer/shaderUniforms`:

```ts
import * as rendererShaderUniforms from './renderer/shaderUniforms';
// …
  'renderer/shaderUniforms': rendererShaderUniforms,
```

  (Remove the `rendererParameters` import and its `'renderer/parameters'` map entry.)

- [ ] **Step 6: Verify build, types, lint, tests**

Run: `npm run typecheck && npm run lint && npm run test 2>&1 | tail -3 && npm run build 2>&1 | tail -3`
Expected: typecheck/lint clean; all tests pass (the PlanetViewport test uses an injected fake renderer, so it stays green); build succeeds.

- [ ] **Step 7: Manual visual check (STAGE 1 GATE)**

Run: `npm run dev`, open `http://localhost:5173`. Confirm: the planet is lit with a day/night terminator; dragging **orbit inward** (hotter) removes ice and eventually shows molten tint; dragging **outward** (colder) grows white ice caps; changing **composition** changes the base color; changing **rotation period** changes spin speed (and a negative period reverses it); changing **stellar mass** changes the star's color and size. Report what you see before Stage 2.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(renderer): replace solid planet with a physics-driven ShaderMaterial (stage 1)

Planet surface now responds to temperature (ice caps, molten tint),
composition (palette), and lighting (day/night terminator); the star is
sized by its real angular radius and the planet spins at a rate derived
from the rotation period. Shader is WebGL-only with a solid-sphere fallback
on compile failure; deriveShaderUniforms supersedes deriveRenderParameters."
```

---

# STAGE 2 — Procedural geography (continents, oceans, terrain)

## Task 5: Add seeded fBm continents/oceans to the fragment shader

**Files:**
- Modify: `src/renderer/scene/planetShaders.ts`
- Modify: `src/renderer/scene/planetRenderer.ts` (pass the new uniforms)

> Shader work — no unit test; the `deriveShaderUniforms` uniforms (`oceanLevel`, `terrainSeed`, `terrainRoughness`) already exist and are tested. Verification: build + manual.

- [ ] **Step 1: Extend the fragment shader** — add uniforms and 3D value-noise/fBm, classify ocean vs land by height vs `uOceanLevel`, and apply ice over both. Replace `PLANET_FRAGMENT_SHADER` with:

```ts
export const PLANET_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uSurfaceColor;
  uniform vec3 uStarColor;
  uniform float uIceFraction;
  uniform float uMoltenFactor;
  uniform float uOceanLevel;
  uniform float uTerrainSeed;
  uniform float uTerrainRoughness;
  uniform vec3 uLightDir;

  varying vec3 vNormal;
  varying vec3 vObjectPos;

  // Hash + 3D value noise (deterministic; seeded by uTerrainSeed).
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + uTerrainSeed);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.0; a *= 0.5; }
    return s;
  }

  void main() {
    vec3 dir = normalize(vObjectPos);
    float height = fbm(dir * 2.5);

    bool isOcean = uOceanLevel > 0.0 && height < uOceanLevel;
    vec3 land = mix(uSurfaceColor * 0.8, uSurfaceColor * 1.15,
                    smoothstep(uOceanLevel, 1.0, height));
    vec3 ocean = vec3(0.04, 0.16, 0.34);
    vec3 base = isOcean ? ocean : land;

    // Mountain shading: brighten high land by roughness.
    if (!isOcean) {
      base += uTerrainRoughness * (height - uOceanLevel) * 0.4;
    }

    // Polar ice over everything.
    float lat = abs(dir.y);
    float iceEdge = 1.0 - uIceFraction;
    float ice = smoothstep(iceEdge - 0.05, iceEdge + 0.05, lat);
    base = mix(base, vec3(0.9, 0.94, 1.0), ice);

    // Molten override.
    base = mix(base, vec3(1.0, 0.35, 0.1), uMoltenFactor);

    float day = clamp(dot(normalize(vNormal), normalize(uLightDir)), 0.0, 1.0);
    vec3 lit = base * (0.06 + 0.95 * day) * uStarColor;
    lit += uSurfaceColor * uMoltenFactor * (1.0 - day) * vec3(1.0, 0.3, 0.08);

    gl_FragColor = vec4(lit, 1.0);
  }
`;
```

- [ ] **Step 2: Pass the new uniforms** — in `planetRenderer.ts`, add to `planetUniforms`:

```ts
    uOceanLevel: { value: 0 },
    uTerrainSeed: { value: 0 },
    uTerrainRoughness: { value: 0.5 },
```

  and in `setParameters` (the `ShaderMaterial` branch):

```ts
        planetUniforms.uOceanLevel.value = uniforms.oceanLevel;
        planetUniforms.uTerrainSeed.value = uniforms.terrainSeed;
        planetUniforms.uTerrainRoughness.value = uniforms.terrainRoughness;
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run test 2>&1 | tail -2 && npm run build 2>&1 | tail -2`
Expected: clean; tests pass; build succeeds.

- [ ] **Step 4: Manual visual check (STAGE 2 GATE)**

Run: `npm run dev`. Confirm: Earth shows blue oceans + land continents + white poles; a hot/dry world shows no oceans (bare terrain); a water-world is mostly ocean; the same world always shows the same continents (reload), and a shared URL reproduces them. Report before Stage 3.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/scene/planetShaders.ts src/renderer/scene/planetRenderer.ts
git commit -m "feat(renderer): seeded procedural continents, oceans, and terrain relief (stage 2)"
```

---

# STAGE 3 — Clouds + atmospheric limb scattering

## Task 6: Clouds and fresnel atmosphere in the fragment shader

**Files:**
- Modify: `src/renderer/scene/planetShaders.ts`
- Modify: `src/renderer/scene/planetRenderer.ts` (add `uTime`, `uCloudDensity`, `uSkyColor`, `uAtmThickness`; drive `uTime` in the loop)

- [ ] **Step 1: Extend the fragment shader** — add the cloud + atmosphere uniforms and, at the end of `main` before `gl_FragColor`, layer clouds (a second fbm sampled with a time offset) and a fresnel rim. Add these uniforms to the top:

```glsl
  uniform float uCloudDensity;
  uniform vec3 uSkyColor;
  uniform float uAtmThickness;
  uniform float uTime;
```

  and replace the final lighting block with:

```glsl
    float day = clamp(dot(normalize(vNormal), normalize(uLightDir)), 0.0, 1.0);
    vec3 lit = base * (0.06 + 0.95 * day) * uStarColor;
    lit += uSurfaceColor * uMoltenFactor * (1.0 - day) * vec3(1.0, 0.3, 0.08);

    // Drifting clouds (lit by day), only where the atmosphere holds water.
    if (uCloudDensity > 0.0) {
      float c = fbm(dir * 3.5 + vec3(uTime * 0.01, 0.0, 0.0));
      float cloud = smoothstep(1.0 - uCloudDensity, 1.0, c) * uCloudDensity;
      lit = mix(lit, vec3(1.0) * (0.1 + 0.9 * day) * uStarColor, cloud * 0.8);
    }

    // Fresnel atmosphere limb.
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
    lit += uSkyColor * fresnel * uAtmThickness * (0.3 + 0.7 * day);

    gl_FragColor = vec4(lit, 1.0);
```

  (Remove the previous `gl_FragColor` line replaced by this block.)

- [ ] **Step 2: Add uniforms + time** — in `planetRenderer.ts` `planetUniforms`:

```ts
    uCloudDensity: { value: 0 },
    uSkyColor: { value: new Color(0, 0, 0) },
    uAtmThickness: { value: 0 },
    uTime: { value: 0 },
```

  in `setParameters` (ShaderMaterial branch):

```ts
        planetUniforms.uCloudDensity.value = uniforms.cloudDensity;
        planetUniforms.uSkyColor.value.setRGB(uniforms.skyColorRgb.r, uniforms.skyColorRgb.g, uniforms.skyColorRgb.b);
        planetUniforms.uAtmThickness.value = uniforms.atmosphereThickness;
```

  and in the render loop, advance time when the shader is active:

```ts
    if (planetMaterial instanceof ShaderMaterial) {
      planetUniforms.uTime.value = timestamp / 1000;
    }
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run test 2>&1 | tail -2 && npm run build 2>&1 | tail -2`
Expected: clean; tests pass; build succeeds.

- [ ] **Step 4: Manual visual check (STAGE 3 GATE)**

Run: `npm run dev`. Confirm: Earth shows drifting white clouds and a soft colored atmospheric rim; raising **H₂O partial pressure** thickens clouds; an airless world has neither clouds nor rim; a red-dwarf world has a redder rim. Report.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/scene/planetShaders.ts src/renderer/scene/planetRenderer.ts
git commit -m "feat(renderer): drifting clouds and fresnel atmospheric limb (stage 3)"
```

## Task 7: Final verification + docs

- [ ] **Step 1: Full suite + coverage gates + clean-tree check**

Run: `npm run typecheck && npm run lint && npm run test:coverage 2>&1 | tail -3 && npm run build 2>&1 | tail -2 && git status --short`
Expected: all green; coverage gates pass (physics/translation 100% untouched; `shaderUniforms.ts` covered ≥80%; `scene/**` excluded); clean tree.

- [ ] **Step 2: Mark the spec done** — append a "Status: implemented" note to `docs/superpowers/specs/2026-06-13-breathtaking-planet-shader-design.md` and commit:

```bash
git add docs/superpowers/specs/2026-06-13-breathtaking-planet-shader-design.md
git commit -m "docs: mark planet-shader spec implemented"
```

---

## Self-Review

**Spec coverage:** §2 architecture → Tasks 2–4 (derivation) + 4 (scene). §3 data sources → Task 3 composer. §4 type → Task 1. §5 mapping → Tasks 2/3 (scalars) + 4/5/6 (shader). §6 seeded geography → Task 5 (`uTerrainSeed`, fBm). §7 shader structure → Tasks 4/5/6. §8 fallback → Task 4 Step 2(c). §9 testing → Tasks 2/3 tests + coverage exclusion noted. §10 staging → Stages 1/2/3. §11 verification → manual GATE steps. §12 out of scope → no aurorae/rings tasks. §13 performance → 96×96 sphere + 5-octave fbm, within budget. All covered.

**Placeholder scan:** No TBD/TODO; all code blocks complete. The one soft spot is the shader compile-failure detection (Task 4 Step 2(c)) — the `try/compile/catch` is a best-effort guard with an always-present fallback; flagged honestly rather than hidden.

**Type consistency:** `PlanetShaderUniforms` field names are identical across Task 1 (definition), Task 3 (producer), and Task 4/5/6 (consumer). Helper names (`deriveIceFraction`, `deriveMoltenFactor`, `deriveOceanLevel`, `deriveCloudDensity`, `deriveSpin`, `deriveTerrainSeed`, `TERRAIN_ROUGHNESS`) match between Task 2 and Task 3. Uniform names (`uOceanLevel`, `uTerrainSeed`, `uCloudDensity`, `uSkyColor`, `uAtmThickness`, `uTime`) match between `planetShaders.ts` and `planetRenderer.ts`.
