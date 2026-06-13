# Viewport Perspectives — Design Spec

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Scope:** Turn the decorative mode rail into a working camera view-switcher. The three rail icons (cockpit/rover/shuttle) become labeled controls that reframe the camera on the **same computed world** — an Observation orbital view, a close Surface pass, and a pulled-back System view with a clearly-schematic orbit. No new physics; the renderer remains the camera's sole owner.

---

## 1. Goal & motivation

The mode rail shipped as decoration: three icons, two locked, doing nothing, and illegible as flattened silhouettes. This spec gives them a real, honest job — switching how the camera frames the computed planet — and fixes legibility by labeling each control with text.

Every view is the *same* physics-driven world (CLAUDE.md §8). The only non-literal element is the System view's orbit ring, which is explicitly labeled "schematic / not to scale" per §6 (mark non-literal representations honestly). No invented physics, no new dependency (§17), no free-camera library.

## 2. The three views

| View | Icon + label | Camera framing | Honesty |
|---|---|---|---|
| **Observation** | cockpit · `OBSERVATION` | The current pull-back framing: planet centered, `z ≈ 3.2`, looking at origin. The default. | Literal. |
| **Surface** | rover · `SURFACE` | Camera dives close (`z ≈ 1.25`) with a slight downward tilt, skimming the computed fBm terrain. Same shader, same physics — just proximity. | Literal (a close pass over the real surface). |
| **System** | shuttle · `SYSTEM` | Camera pulls back (`z ≈ 8`) and a schematic group becomes visible: a star marker at a schematic center, a dashed orbit ring, and the planet sitting on the ring. Hidden in the other two views. | Schematic, explicitly labeled. The orbit ring is **not to scale** (1 AU ≈ 23,000 planet radii cannot be shown literally); the real AU is displayed alongside a "NOT TO SCALE" note. |

## 3. Architecture

### 3.1 `PlanetView` type (`src/types/render.ts`)

```ts
/** Which curated camera framing of the computed world the viewport shows. */
export type PlanetView = 'observation' | 'surface' | 'system';
```

### 3.2 Pure camera-target derivation (`src/renderer/cameraView.ts`, new)

A pure, unit-tested function maps a view to its camera target — position, look-at focus, and whether the schematic group is shown. Keeping the per-view geometry in a pure function (not buried in the GL loop) lets it be tested without WebGL (renderer ≥80% gate; the GL animation itself is coverage-excluded).

```ts
export interface CameraTarget {
  /** Target camera position in scene units. */
  positionX: number;
  positionY: number;
  positionZ: number;
  /** Whether the System schematic (star marker + orbit ring) is visible. */
  schematicVisible: boolean;
}

export function deriveCameraTarget(view: PlanetView): CameraTarget;
```

(Focus is always the origin for Observation/Surface; for System the camera looks at the schematic center. The exact constants live here and are asserted in tests — e.g. Surface `positionZ` < Observation `positionZ` < System `positionZ`, and `schematicVisible` true only for System.)

### 3.3 Renderer (`src/renderer/scene/planetRenderer.ts`)

- `PlanetRenderer` gains `setView(view: PlanetView): void`. It records the target from `deriveCameraTarget`.
- The existing render loop **lerps** `camera.position` toward the target each frame (smooth, intentional transitions) and re-aims the camera at the focus. A small fixed lerp factor; no easing library.
- A **schematic group** is added once at construction (a star-marker sphere at a schematic center, a dashed/thin orbit ring via `RingGeometry` or a line loop, sized so the planet at origin lies on it), `visible = false` by default and toggled by `setView`. It uses unlit basic materials (it is a diagram, not a lit body). Disposed in `dispose()`.
- Render-pass ordering (§8) is preserved; the schematic group sits with the space/stellar passes (it is only shown in the pulled-back System view).

### 3.4 View label overlay (`src/ui/ViewLabel.tsx`, new)

A small HUD caption inside the viewport showing the active view name. In System view it also shows the honest orbit line built from the computed `semiMajorAxisAstronomicalUnits`:

```
SYSTEM
ORBIT · 0.95 AU · SCHEMATIC · NOT TO SCALE
```

Pure presentational chrome; reads the active view (prop) and the world's AU (from the store).

### 3.5 Rail as a real control (`src/ui/ModeRail.tsx`, modify)

- Three **labeled buttons** (icon + uppercase label), all now available — the locked/"coming soon" framing is removed entirely.
- Props: `view: PlanetView` and `onSelectView: (view: PlanetView) => void`.
- Each is a real `<button>`; clicking calls `onSelectView`. The active button is highlighted and marked `aria-current="true"`; it remains clickable (re-selecting is a no-op).
- `MissionIcon` state: `active` for the selected view, `idle` for the others (no more `locked`).

### 3.6 State + wiring (`src/ui/PlanetViewport.tsx`, modify)

- `PlanetViewport` owns `const [view, setView] = useState<PlanetView>('observation')` — UI-only state that never reaches physics (§4: ui may hold UI-only state).
- It passes `view` + `setView` to `ModeRail`, passes `view` to `ViewLabel`, and in an effect calls `rendererRef.current?.setView(view)` whenever `view` changes.
- Default view is Observation.

## 4. Module boundaries (unchanged)

All changes live in `renderer/` (camera, scene) and `ui/` (rail, overlay, viewport state). No physics, store, translation, or AI module is touched. The renderer reads only `PlanetView` (a render type) and the already-derived shader uniforms; it remains a read-only consumer of computed state (ADR-006).

## 5. Testing (CLAUDE.md §11)

- **`deriveCameraTarget`** (`src/renderer/cameraView.test.ts`): asserts the per-view invariants — Surface is closer than Observation which is closer than System (`positionZ` ordering), and `schematicVisible` is true only for System. Pure, no GL.
- **`ModeRail`** (update `ModeRail.test.tsx`): three enabled buttons with their labels; the one matching the `view` prop is `aria-current`; clicking a button calls `onSelectView` with the right id. No locked assertions remain.
- **`ViewLabel`** (`ViewLabel.test.tsx`): renders the active view name; shows the AU + "NOT TO SCALE" note only in System view; omits it otherwise.
- **`PlanetViewport`** (update `PlanetViewport.test.tsx`): the injected fake renderer gains a `setView` spy; assert `setView('observation')` is called on mount, and that clicking a rail button drives `setView` with the new view. The existing uniforms/empty-deck/dispose tests stay green.
- **GL camera animation** verified by eye at a visual gate (`npm run dev`): smooth transitions, Surface skims terrain, System shows the labeled schematic.

## 6. Out of scope (YAGNI)

- No free-orbit/drag camera, no zoom slider, no camera-controls dependency.
- No real multi-body system, no second planet/moon, no walkable surface.
- No persistence of the selected view in the URL/share token (resets to Observation on load).
- No physics, store, translation, or AI changes.

## 7. Risks & mitigations

- **System schematic reads as "real" orbit** — mitigated by the explicit "SCHEMATIC · NOT TO SCALE" label and a deliberately diagrammatic (dashed/thin, unlit) ring distinct from the lit planet.
- **Surface view just shows a featureless close sphere** — the fBm terrain already provides relief; if the close pass reads flat, the visual gate decides a tilt/position tweak. Honest either way (it is the real surface).
- **Camera lerp interacting with resize/aspect** — the lerp only touches `camera.position`/aim; `resize` continues to own aspect. No conflict expected; confirmed at the gate.

## 8. Verification reality

As with the shader and icons, the camera framings can only be judged by running the app. Expect one or two visual round-trips to settle the Surface proximity/tilt and the System schematic's ring size and label placement. Work is staged so each step builds, tests green, and is viewable: (1) `PlanetView` + `deriveCameraTarget` + tests; (2) renderer `setView` + camera lerp + schematic group; (3) rail as control + viewport state; (4) `ViewLabel` overlay; (5) verification + visual gate.

---

## Status: Implemented (2026-06-14)

Shipped and visually verified by the project owner. The mode rail is now a working camera view-switcher: Observation (default orbital framing), Surface (close terrain pass), and System (pulled-back, labeled "SCHEMATIC · NOT TO SCALE" orbit with the real AU). A pure `deriveCameraTarget` (unit-tested) drives the renderer's `setView`, which lerps the camera each frame; the System schematic group toggles with the view. `ViewLabel` shows the active view + honest orbit note. Pure renderer/ui chrome; no physics/store/translation/AI changes. All tests green; coverage gates pass; build clean.
