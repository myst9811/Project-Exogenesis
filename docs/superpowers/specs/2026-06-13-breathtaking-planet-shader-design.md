# Design Spec — Breathtaking Physics-Derived Planet Shader

**Date:** 2026-06-13
**Status:** Approved for planning
**Scope:** Renderer (`src/renderer/`) and the viewport wiring (`src/ui/PlanetViewport.tsx`). No physics, store, or translation changes.

---

## 1. Motivation

The planet renders as a single solid-color lit sphere whose surface color derives from **only** composition class + bond albedo. Consequences:

- **Plain:** no terrain, oceans, ice, clouds, day/night detail, or atmospheric depth.
- **Unresponsive:** changing mass, radius, orbit, temperature, rotation, or atmosphere amounts produces *zero* visible change to the planet. Only the small side-star tint (stellar mass) and a faint atmosphere shell (pressure) respond.
- **Wasted derivation:** the star's `angularRadiusRadians` is computed but never applied (fixed-size disc); rotation speed is a hardcoded constant.

Goal: a custom GLSL planet that is breathtaking **and** makes every major parameter visibly transform the world — achieved by deriving far more visual richness from physics we already compute (CLAUDE.md §8: every visual parameter is a function of physics state).

## 2. Architecture

Two layers, mirroring the existing renderer split (ADR-006: the renderer is a pure function of computed state).

### 2.1 Derivation layer — pure, tested

**New: `src/renderer/shaderUniforms.ts`** exporting `deriveShaderUniforms(state, liquidWater) → PlanetShaderUniforms`.

- Pure and total: maps `PlanetaryState` (+ the computed `LiquidWaterAssessment`) to every scalar/color/threshold the shader needs.
- Reuses existing derivations rather than duplicating: `deriveBlackbodyColor`, `deriveStarAngularRadius`, `deriveSurfaceColor` (as the base palette), `deriveAtmosphereAppearance`.
- This is where §8 lives — every uniform is a documented function of physics. Fully unit-tested at the renderer 80% coverage gate.

### 2.2 Scene layer — GLSL, not unit-tested

**`src/renderer/scene/planetRenderer.ts`** (existing scene) swaps the planet's `MeshStandardMaterial` for a custom `ShaderMaterial`. New GLSL lives in **`src/renderer/scene/planetShaders.ts`** (vertex + fragment source as exported strings). The `PlanetRenderer` interface (`setParameters` / `resize` / `dispose`) is unchanged; only the parameter **type** changes from `RenderParameters` to `PlanetShaderUniforms`.

- Requires a WebGL context → **excluded from coverage** (already true for `src/renderer/scene/**` in `vitest.config.ts`), verified by `npm run build` and by running the app.

### 2.3 Charter compliance

- §8: no visual constant — every uniform derives from physics (table in §5). The few spatial patterns the physics doesn't compute (continent placement) are deterministic procedural variation seeded from `configurationHash` (§6, ADR-004), never asserted as real geography.
- §4 boundary: the renderer imports physics **types** only (`PlanetaryState`, `LiquidWaterAssessment`), never calculation code. The lint boundary rules already enforce this.

## 3. Data sources (all already computed)

| Uniform input | Source field |
|---|---|
| Surface temperature (K) | `state.climate.surfaceTemperatureKelvin` |
| Surface pressure (kPa) | `state.atmosphere.surfacePressureKilopascals` |
| Water-vapor partial pressure (kPa) | `state.configuration.atmosphere.partialPressuresKilopascals.H2O ?? 0` |
| Composition class | `state.configuration.planetary.compositionClass` |
| Bond albedo | `state.climate.bondAlbedo` |
| Liquid water possible | `liquidWater.possible` (from `habitability.liquidWater`) |
| Stellar effective temp (K) | `state.stellar.effectiveTemperatureKelvin` |
| Stellar radius / orbit (m) | `state.stellar.radiusMeters`, `state.orbit.semiMajorAxisMeters` |
| Rotation period (h, signed) | `state.configuration.rotation.rotationPeriodHours` (negative = retrograde) |
| Deterministic seed | `state.configurationHash` (hex string) |

**Wiring change:** `PlanetViewport` already reads `state.planetaryState`; it will also read `state.habitability` (store-held) and pass `habitability.liquidWater` into `deriveShaderUniforms`. The render effect keys on `configurationHash` so it re-pushes uniforms whenever the world changes.

## 4. The `PlanetShaderUniforms` contract

A new type in `src/types/render.ts` (or a dedicated `render` type module). Indicative shape:

```ts
interface PlanetShaderUniforms {
  // Surface
  surfaceColorRgb: ColorRGB;        // base palette from composition × albedo
  iceFraction: number;              // 0–1, polar-cap extent from temperature
  oceanLevel: number;               // 0–1 sea level; 0 when no liquid water/water absent
  moltenFactor: number;             // 0–1 emissive lava when scorching
  terrainSeed: number;              // deterministic, from configurationHash
  terrainRoughness: number;         // composition-driven relief amplitude
  // Atmosphere
  atmospherePresent: boolean;
  skyColorRgb: ColorRGB;            // Rayleigh tint of the stellar spectrum
  atmosphereThickness: number;      // 0–1 from surface pressure (limb glow + terminator softness)
  cloudDensity: number;             // 0–1 from water vapor × pressure
  // Star / motion
  starColorRgb: ColorRGB;           // blackbody
  starAngularRadius: number;        // radians — sizes the disc (currently unused)
  spinRadiansPerSecond: number;     // visual spin from rotation period (sign = direction)
}
```

## 5. Physics → visual mapping

| Visual feature | Derived from | Behavior |
|---|---|---|
| Surface palette | composition class × bond albedo | rocky tan/grey · iron rust · water-world blue · gas-dwarf banded cream (reuses `deriveSurfaceColor`) |
| **Oceans** | `liquidWater.possible` **and** water present (H₂O pressure > 0 or water-world) | `oceanLevel > 0` only when liquid water is thermodynamically possible *and* water exists; else dry / ice / molten |
| Polar ice caps | surface temperature | `iceFraction` grows as temp falls; → 1 (snowball) below freezing; → 0 when hot |
| Molten surface | surface temp ≳ 1000 K | `moltenFactor` ramps up; emissive glowing cracks |
| Continent shapes | `configurationHash` seed | procedural fBm noise in-shader; deterministic per world |
| Mountain relief | composition + noise | `terrainRoughness` drives normal perturbation (rocky rough, gas-dwarf smooth) |
| Clouds | water-vapor pressure × total pressure | `cloudDensity`; 0 if dry/airless; slow deterministic drift |
| Atmosphere limb glow | stellar spectrum + surface pressure | fresnel rim in `skyColorRgb`, intensity from `atmosphereThickness` |
| Day/night terminator | star direction (scene light) | lit day side, dark night side; terminator softness scales with `atmosphereThickness` |
| Star color | blackbody effective temp | `starColorRgb` (reuses `deriveBlackbodyColor`) |
| Star **size** | angular radius | disc sized by `starAngularRadius` (finally applied) |
| Spin rate & direction | rotation period (signed) | `spinRadiansPerSecond ∝ 1/period`, sign sets prograde/retrograde |

Result: dragging any major slider visibly transforms the planet, resolving the "nothing changes" problem.

## 6. Procedural geography (deterministic)

- Continent/terrain placement uses fractal-Brownian-motion value noise evaluated in the fragment shader over the sphere surface.
- The noise is **seeded from `configurationHash`** (passed as `terrainSeed`) — no `Math.random` anywhere (ADR-004). The same world always renders the same map; a shared URL reproduces the exact appearance.
- Placement is explicitly *procedural variation*, never presented as real geography. Whether a region reads as ocean / land / ice / molten is **physics-driven** (§5); only *where* the noise puts highlands is procedural.

## 7. Shader structure

- **Vertex shader:** standard model→world→clip transform; pass world-space normal + position and a sphere-UV / direction for noise sampling.
- **Fragment shader:** (1) sample fBm height at the surface direction; (2) classify ocean/land via `oceanLevel` vs height; (3) tint by physics — ocean blue, land from palette, ice by `iceFraction` toward the poles, molten emissive by `moltenFactor`; (4) perturb normal by terrain slope for relief shading; (5) Lambert day-lighting from the star direction + soft terminator; (6) fresnel atmosphere rim using `skyColorRgb` × `atmosphereThickness`; (7) overlay drifting clouds by `cloudDensity`.
- A `uTime` uniform drives cloud drift and the spin; spin may also be applied as mesh rotation (cheaper) — implementation detail for the plan.

## 8. Fallback & safety

A shader-compile or link failure must **not** blank the viewport. The scene will:
1. Attempt to build the `ShaderMaterial`.
2. On compile error (checked via the program info log), fall back to the current `MeshStandardMaterial` solid sphere and log a single console error.

This guarantees the app never regresses below today's baseline even if the shader misbehaves in a browser I cannot see.

## 9. Testing strategy

- **Tested** (renderer ≥80% gate): `deriveShaderUniforms` — Earth → oceans + moderate ice + clouds; hot inner world → `moltenFactor` high, `oceanLevel` 0; cold outer world → `iceFraction` → 1; airless world → `cloudDensity` 0, `atmospherePresent` false; star sizing from angular radius; spin sign from retrograde rotation; determinism (same state → identical uniforms; same `configurationHash` → identical `terrainSeed`).
- **Not tested:** the GLSL strings and the `ShaderMaterial` wiring (no WebGL in jsdom) — consistent with the existing `renderer/scene/**` coverage exclusion.
- The 100%-covered physics/translation layers and all existing tests stay green; this is additive.

## 10. Staging (independently runnable increments)

1. **Responsiveness + surface:** `deriveShaderUniforms` + the shader with temperature surface coloring, ice caps, sized star, physics spin, fallback. Fixes "nothing changes."
2. **Geography:** procedural continents/oceans (seeded) + terrain relief.
3. **Atmosphere & sky:** clouds + fresnel limb scattering + day/night terminator polish.

Each stage compiles, passes tests, builds, and is viewable via `npm run dev`.

## 11. Verification reality (explicit)

**I cannot see the rendered output.** A shader bug could render black or wrong and I will not catch it without you. You are the visual verifier: run `npm run dev` after each stage and report what you see; we iterate. The §8 fallback (solid sphere) bounds the downside, but expect a couple of visual round-trips per stage to reach "sick."

## 12. Out of scope

- **Aurorae / magnetosphere** — the engine computes no magnetic field; rendering one would be invented physics (§6 forbids). Deferred until a magnetism model exists.
- Rings, moons, multi-star skies, city lights — no computed basis.
- Changes to physics, store, translation, or habitability logic.

## 13. Performance budget

Target 60 fps (CLAUDE.md §18). A single fragment shader over one sphere with 3–4 noise octaves + cloud layer is well within budget on modern GPUs. `uTime`-driven drift is cheap. No profiling-driven optimization unless a measured frame-time regression appears.
