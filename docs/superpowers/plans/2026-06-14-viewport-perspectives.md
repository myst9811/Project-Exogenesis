# Viewport Perspectives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the decorative mode rail into a working camera view-switcher — Observation / Surface / System — that reframes the camera on the same computed world, with a labeled, schematic System orbit.

**Architecture:** A pure `deriveCameraTarget(view)` holds per-view camera geometry (unit-tested). The renderer gains `setView(view)` and lerps the camera toward that target each frame; a schematic orbit group is toggled for the System view. The rail becomes labeled buttons driving `view` state in `PlanetViewport`, and a `ViewLabel` overlay shows the active view (plus the honest "not to scale" AU note in System).

**Tech Stack:** TypeScript (strict), Three.js, React, Vitest + Testing Library, CSS.

---

## File Structure

- **Modify** `src/types/render.ts` — add the `PlanetView` union.
- **Create** `src/renderer/cameraView.ts` + `src/renderer/cameraView.test.ts` — pure per-view camera target derivation (renderer ≥80% gate).
- **Modify** `src/renderer/scene/planetRenderer.ts` — `setView` method, camera lerp in the loop, a schematic orbit group toggled by view. (WebGL; coverage-excluded.)
- **Modify** `src/ui/ModeRail.tsx` + `src/ui/ModeRail.test.tsx` — labeled buttons; props `view` + `onSelectView`; no more locked tiles.
- **Create** `src/ui/ViewLabel.tsx` + `src/ui/ViewLabel.test.tsx` — active-view caption + System AU note.
- **Modify** `src/ui/PlanetViewport.tsx` + `src/ui/PlanetViewport.test.tsx` — own `view` state; wire rail, overlay, and `renderer.setView`.
- **Modify** `src/index.css` — labeled-rail and view-label styles.

Staged: (1) `PlanetView` + `deriveCameraTarget`; (2) renderer `setView` + lerp + schematic; (3) rail as control; (4) viewport state wiring; (5) `ViewLabel`; (6) verification + visual gate.

---

## Task 1: `PlanetView` type + pure camera-target derivation

**Files:**
- Modify: `src/types/render.ts`
- Create: `src/renderer/cameraView.ts`, `src/renderer/cameraView.test.ts`

- [ ] **Step 1: Add the `PlanetView` type** — append to `src/types/render.ts`:

```ts
/** Which curated camera framing of the computed world the viewport shows. */
export type PlanetView = 'observation' | 'surface' | 'system';
```

- [ ] **Step 2: Write the failing test** — `src/renderer/cameraView.test.ts`:

```ts
/**
 * @module renderer/cameraView.test
 */

import { describe, expect, it } from 'vitest';

import { deriveCameraTarget } from './cameraView';

describe('deriveCameraTarget', () => {
  it('frames Observation at the default mid distance, schematic hidden', () => {
    const t = deriveCameraTarget('observation');
    expect(t.positionZ).toBeCloseTo(3.2, 5);
    expect(t.schematicVisible).toBe(false);
  });

  it('moves the camera closer for Surface than for Observation', () => {
    expect(deriveCameraTarget('surface').positionZ).toBeLessThan(
      deriveCameraTarget('observation').positionZ,
    );
    expect(deriveCameraTarget('surface').schematicVisible).toBe(false);
  });

  it('pulls the camera back for System and shows the schematic', () => {
    const system = deriveCameraTarget('system');
    expect(system.positionZ).toBeGreaterThan(deriveCameraTarget('observation').positionZ);
    expect(system.schematicVisible).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/renderer/cameraView.test.ts`
Expected: FAIL — `./cameraView` not found.

- [ ] **Step 4: Implement** — `src/renderer/cameraView.ts`:

```ts
/**
 * @module renderer/cameraView
 *
 * Pure per-view camera geometry for the viewport perspectives. Maps a
 * `PlanetView` to the camera's target position and whether the System
 * schematic (star marker + orbit ring) is shown. Kept pure and free of
 * Three.js so it is unit-testable without a WebGL context (CLAUDE.md §11);
 * the scene applies these targets and animates toward them.
 */

import type { PlanetView } from '../types/render';

/** A camera framing target the scene lerps toward. Units are scene units. */
export interface CameraTarget {
  positionX: number;
  positionY: number;
  positionZ: number;
  /** Whether the System schematic group is visible in this view. */
  schematicVisible: boolean;
}

/** Planet sits at the origin with radius 1; these frame it three ways. */
const TARGETS: Record<PlanetView, CameraTarget> = {
  // Default mid-distance orbital view (matches the original fixed camera).
  observation: { positionX: 0, positionY: 0, positionZ: 3.2, schematicVisible: false },
  // Close pass: skim the computed terrain, slightly above the equator.
  surface: { positionX: 0, positionY: 0.35, positionZ: 1.25, schematicVisible: false },
  // Pulled back and raised to look down on the labeled orbit schematic.
  system: { positionX: 0, positionY: 3.5, positionZ: 8, schematicVisible: true },
};

/**
 * Returns the camera target for a view.
 *
 * @param view - The selected viewport perspective
 * @returns The target camera position and schematic visibility
 */
export function deriveCameraTarget(view: PlanetView): CameraTarget {
  return TARGETS[view];
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/renderer/cameraView.test.ts && npm run typecheck && npm run lint`
Expected: PASS; clean.

- [ ] **Step 6: Commit**

```bash
git add src/types/render.ts src/renderer/cameraView.ts src/renderer/cameraView.test.ts
git commit -m "feat(renderer): add PlanetView and pure per-view camera target derivation"
```

---

## Task 2: Renderer `setView`, camera lerp, schematic orbit group

**Files:**
- Modify: `src/renderer/scene/planetRenderer.ts`

> WebGL-only; `src/renderer/scene/**` is coverage-excluded. Verification: build + the visual gate in Task 6. The pure target math is already tested in Task 1.

- [ ] **Step 1: Add imports** — in `src/renderer/scene/planetRenderer.ts`, extend the `three` import list with `Group` and `RingGeometry`, and add the type + derivation imports. Add `Group,` after `Float32BufferAttribute,` and `RingGeometry,` after `PointsMaterial,` in the existing `from 'three'` block, then add below the existing imports:

```ts
import type { PlanetShaderUniforms, PlanetView } from '../../types/render';
import { deriveCameraTarget } from '../cameraView';
```

(The file already imports `PlanetShaderUniforms` from `'../../types/render'`; change that line to also import `PlanetView` as shown, rather than adding a duplicate import.)

- [ ] **Step 2: Extend the `PlanetRenderer` interface** — add `setView` after `setParameters`:

```ts
export interface PlanetRenderer {
  /** Applies derived visual parameters to the scene. */
  setParameters: (uniforms: PlanetShaderUniforms) => void;
  /** Selects which camera framing of the world to show. */
  setView: (view: PlanetView) => void;
  /** Resizes the drawing buffer and camera to the given pixel size. */
  resize: (width: number, height: number) => void;
  /** Releases GPU resources and stops the animation loop. */
  dispose: () => void;
}
```

- [ ] **Step 3: Build the schematic orbit group** — after the atmosphere shell block (the `scene.add(atmosphere);` line, ~line 194), add:

```ts
  // System-view schematic (CLAUDE.md §6: a labeled, deliberately not-to-scale
  // diagram, not a literal orbit). A star marker at a schematic center with a
  // thin ring passing through the planet at the origin. Unlit basic materials
  // — it is a diagram, not a body. Hidden outside the System view.
  const SCHEMATIC_CENTER_X = -3;
  const schematic = new Group();
  const orbitRadius = Math.abs(SCHEMATIC_CENTER_X);
  const orbitRingMaterial = new MeshBasicMaterial({
    color: 0x2a_8a_b5,
    transparent: true,
    opacity: 0.5,
    side: BackSide,
  });
  const orbitRing = new Mesh(
    new RingGeometry(orbitRadius - 0.015, orbitRadius + 0.015, 128),
    orbitRingMaterial,
  );
  orbitRing.rotation.x = -Math.PI / 2; // lie flat in the XZ plane
  orbitRing.position.x = SCHEMATIC_CENTER_X;
  schematic.add(orbitRing);
  const starMarkerMaterial = new MeshBasicMaterial({ color: 0xff_d8_8a });
  const starMarker = new Mesh(new SphereGeometry(0.35, 24, 24), starMarkerMaterial);
  starMarker.position.set(SCHEMATIC_CENTER_X, 0, 0);
  schematic.add(starMarker);
  schematic.renderOrder = 1;
  schematic.visible = false;
  scene.add(schematic);
```

- [ ] **Step 4: Add the camera-lerp state + per-frame update** — replace the render-loop bindings and body. Change the existing `let currentSpin = 0;` block (~line 196-209) to:

```ts
  let animationHandle = 0;
  let previousTimestamp = 0;
  let currentSpin = 0;
  const cameraTargetPosition = new Vector3(0, 0, 3.2);
  const focusPoint = new Vector3(0, 0, 0);
  const applyView = (view: PlanetView): void => {
    const target = deriveCameraTarget(view);
    cameraTargetPosition.set(target.positionX, target.positionY, target.positionZ);
    focusPoint.set(target.schematicVisible ? -1.5 : 0, 0, 0);
    schematic.visible = target.schematicVisible;
  };
  const renderLoop = (timestamp: number): void => {
    const delta = previousTimestamp === 0 ? 0 : (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    planet.rotation.y += delta * currentSpin;
    if (planetUsesShader) {
      planetUniforms.uTime.value = timestamp / 1000;
    }
    // Smoothly ease the camera toward the selected view's target.
    camera.position.lerp(cameraTargetPosition, 0.08);
    camera.lookAt(focusPoint);
    renderer.render(scene, camera);
    animationHandle = requestAnimationFrame(renderLoop);
  };
  animationHandle = requestAnimationFrame(renderLoop);
```

(`focusPoint` shifts toward the schematic center in System view so the planet and star marker both sit in frame; the planet, at the origin, stays on the ring.)

- [ ] **Step 5: Add the `setView` method** — in the returned object, after the `setParameters` method (before `resize`), add:

```ts
    setView: (view: PlanetView): void => {
      applyView(view);
    },
```

- [ ] **Step 6: Dispose the schematic** — in `dispose`, after `atmosphereMaterial.dispose();`, add:

```ts
      orbitRing.geometry.dispose();
      orbitRingMaterial.dispose();
      starMarker.geometry.dispose();
      starMarkerMaterial.dispose();
```

- [ ] **Step 7: Verify build + types + lint**

Run: `npm run typecheck && npm run lint && npm run build 2>&1 | tail -2`
Expected: clean; build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/scene/planetRenderer.ts
git commit -m "feat(renderer): setView camera lerp and the System orbit schematic"
```

---

## Task 3: Rail becomes a labeled view control

**Files:**
- Modify: `src/ui/ModeRail.tsx`, `src/ui/ModeRail.test.tsx`, `src/index.css`

- [ ] **Step 1: Replace the test** — overwrite `src/ui/ModeRail.test.tsx`:

```tsx
/**
 * @module ui/ModeRail.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModeRail } from './ModeRail';

afterEach(cleanup);

describe('ModeRail', () => {
  it('renders three enabled view buttons with labels', () => {
    render(<ModeRail view="observation" onSelectView={vi.fn()} />);
    expect(screen.getByRole('button', { name: /observation/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /surface/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /system/i })).not.toBeNull();
  });

  it('marks the active view with aria-current', () => {
    render(<ModeRail view="surface" onSelectView={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /surface/i }).getAttribute('aria-current'),
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: /observation/i }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('calls onSelectView with the chosen view', () => {
    const onSelectView = vi.fn();
    render(<ModeRail view="observation" onSelectView={onSelectView} />);
    fireEvent.click(screen.getByRole('button', { name: /system/i }));
    expect(onSelectView).toHaveBeenCalledWith('system');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/ModeRail.test.tsx`
Expected: FAIL — `ModeRail` does not accept these props / labels absent.

- [ ] **Step 3: Rewrite `ModeRail`** — overwrite `src/ui/ModeRail.tsx`:

```tsx
/**
 * @module ui/ModeRail
 *
 * The viewport perspective switcher: three labeled controls that reframe the
 * camera on the same computed world (Observation / Surface / System). Pure
 * presentational chrome — it owns no state; the selected view and the change
 * handler are supplied by `PlanetViewport`.
 */

import type { JSX } from 'react';

import { MissionIcon, type MissionIconName } from './MissionIcon';
import type { PlanetView } from '../types/render';

interface ViewOption {
  id: PlanetView;
  label: string;
  icon: MissionIconName;
}

const VIEWS: readonly ViewOption[] = [
  { id: 'observation', label: 'Observation', icon: 'cockpit' },
  { id: 'surface', label: 'Surface', icon: 'rover' },
  { id: 'system', label: 'System', icon: 'shuttle' },
];

export function ModeRail({
  view,
  onSelectView,
}: {
  view: PlanetView;
  onSelectView: (view: PlanetView) => void;
}): JSX.Element {
  return (
    <div className="mode-rail" role="group" aria-label="viewport perspectives">
      {VIEWS.map((option) => {
        const isActive = option.id === view;
        return (
          <button
            key={option.id}
            type="button"
            className={`mode-rail__item ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => {
              onSelectView(option.id);
            }}
          >
            <MissionIcon name={option.icon} size={26} state={isActive ? 'active' : 'idle'} />
            <span className="mode-rail__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/ModeRail.test.tsx`
Expected: PASS (all three).

- [ ] **Step 5: Update the styles** — in `src/index.css`, replace the existing `.mode-rail__item` rules (the `.mode-rail__item`, `.mode-rail__item.is-active`, and `.mode-rail__item.is-locked` blocks added for the old rail) with:

```css
.mode-rail__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.45rem 0.5rem;
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  background: rgba(6, 13, 26, 0.55);
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: var(--text-micro);
  letter-spacing: var(--tracking-tactical);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}
.mode-rail__item:hover {
  border-color: var(--border-active);
  color: var(--text-primary);
}
.mode-rail__item.is-active {
  border-color: var(--border-active);
  color: var(--cyan-bright);
  box-shadow: 0 0 10px var(--cyan-glow);
}
.mode-rail__label {
  line-height: 1;
}
```

- [ ] **Step 6: Verify + commit**

Run: `npm run typecheck && npm run lint && npx vitest run src/ui/ModeRail.test.tsx`
Expected: clean; PASS. (PlanetViewport will not typecheck until Task 4 supplies the props — run the project-wide typecheck at the end of Task 4. To keep this commit green in isolation, Task 4 follows immediately.)

```bash
git add src/ui/ModeRail.tsx src/ui/ModeRail.test.tsx src/index.css
git commit -m "feat(ui): mode rail becomes a labeled viewport-perspective control"
```

---

## Task 4: Viewport owns the view state and wires it

**Files:**
- Modify: `src/ui/PlanetViewport.tsx`, `src/ui/PlanetViewport.test.tsx`

- [ ] **Step 1: Update the fake renderer + add a wiring test** — in `src/ui/PlanetViewport.test.tsx`, the `fakeRenderer` helper must add a `setView` spy (the `PlanetRenderer` interface now requires it) and return it. Replace the `fakeRenderer` function with:

```tsx
function fakeRenderer(): {
  renderer: PlanetRenderer;
  setParameters: ReturnType<typeof vi.fn>;
  setView: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
} {
  const setParameters = vi.fn();
  const setView = vi.fn();
  const dispose = vi.fn();
  const renderer: PlanetRenderer = { setParameters, setView, resize: vi.fn(), dispose };
  return { renderer, setParameters, setView, dispose };
}
```

Then add a test inside the `describe` block:

```tsx
  it('selects Observation on mount and switches view when a rail button is clicked', async () => {
    const stores = createAppStores();
    await commitConfiguration(stores, createDefaultConfiguration());
    const { renderer, setView } = fakeRenderer();
    render(
      <StoresProvider stores={stores}>
        <PlanetViewport createRenderer={() => renderer} />
      </StoresProvider>,
    );
    await waitFor(() => {
      expect(setView).toHaveBeenCalledWith('observation');
    });
    fireEvent.click(screen.getByRole('button', { name: /system/i }));
    expect(setView).toHaveBeenCalledWith('system');
  });
```

Add `fireEvent` to the testing-library import on line 6:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/PlanetViewport.test.tsx`
Expected: FAIL — no rail buttons rendered yet / `setView` never called.

- [ ] **Step 3: Wire the viewport** — in `src/ui/PlanetViewport.tsx`:

(a) Update imports — add `useState` and the `PlanetView` type, and ensure `ModeRail` is imported (it already is):

```tsx
import { useEffect, useRef, useState } from 'react';
```

```tsx
import type { PlanetView } from '../types/render';
```

(b) Add the view state after the existing refs (after `rendererRef`):

```tsx
  const [view, setView] = useState<PlanetView>('observation');
```

(c) Push the view to the renderer whenever it changes — add this effect after the existing parameter-feed effect (after the `useEffect` that calls `setParameters`):

```tsx
  useEffect(() => {
    rendererRef.current?.setView(view);
  }, [view]);
```

(d) Pass the props to `ModeRail` in the returned JSX — replace `<ModeRail />` with:

```tsx
      <ModeRail view={view} onSelectView={setView} />
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/PlanetViewport.test.tsx`
Expected: PASS (mount-selects-observation + click-switches-system, plus the existing uniforms/empty-deck/dispose tests).

- [ ] **Step 5: Project-wide verify + commit**

Run: `npm run typecheck && npm run lint && npm run test 2>&1 | tail -3`
Expected: clean; all tests pass (Task 3's `ModeRail` now receives its required props).

```bash
git add src/ui/PlanetViewport.tsx src/ui/PlanetViewport.test.tsx
git commit -m "feat(ui): PlanetViewport owns view state and drives renderer.setView"
```

---

## Task 5: `ViewLabel` overlay

**Files:**
- Create: `src/ui/ViewLabel.tsx`, `src/ui/ViewLabel.test.tsx`
- Modify: `src/ui/PlanetViewport.tsx`, `src/index.css`

- [ ] **Step 1: Write the failing test** — `src/ui/ViewLabel.test.tsx`:

```tsx
/**
 * @module ui/ViewLabel.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ViewLabel } from './ViewLabel';

afterEach(cleanup);

describe('ViewLabel', () => {
  it('shows the active view name', () => {
    render(<ViewLabel view="surface" semiMajorAxisAu={0.95} />);
    expect(screen.getByText('SURFACE')).not.toBeNull();
  });

  it('shows the schematic AU note only in the System view', () => {
    const { rerender } = render(<ViewLabel view="observation" semiMajorAxisAu={0.95} />);
    expect(screen.queryByText(/NOT TO SCALE/)).toBeNull();
    rerender(<ViewLabel view="system" semiMajorAxisAu={0.95} />);
    expect(screen.getByText(/0\.95 AU · SCHEMATIC · NOT TO SCALE/)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/ViewLabel.test.tsx`
Expected: FAIL — `./ViewLabel` not found.

- [ ] **Step 3: Implement** — `src/ui/ViewLabel.tsx`:

```tsx
/**
 * @module ui/ViewLabel
 *
 * A small HUD caption naming the active viewport perspective. In the System
 * view it appends the honest orbit note: the real semi-major axis with an
 * explicit "schematic / not to scale" qualifier (CLAUDE.md §6), since an orbit
 * cannot be drawn to scale beside a planet. Pure presentational chrome.
 */

import type { JSX } from 'react';

import type { PlanetView } from '../types/render';

const VIEW_NAME: Record<PlanetView, string> = {
  observation: 'OBSERVATION',
  surface: 'SURFACE',
  system: 'SYSTEM',
};

export function ViewLabel({
  view,
  semiMajorAxisAu,
}: {
  view: PlanetView;
  semiMajorAxisAu: number;
}): JSX.Element {
  return (
    <div className="view-label" aria-hidden="true">
      <span className="view-label__name">{VIEW_NAME[view]}</span>
      {view === 'system' && (
        <span className="view-label__note">
          ORBIT · {semiMajorAxisAu.toFixed(2)} AU · SCHEMATIC · NOT TO SCALE
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/ViewLabel.test.tsx`
Expected: PASS (both).

- [ ] **Step 5: Mount it in the viewport** — in `src/ui/PlanetViewport.tsx`:

(a) Add the import:

```tsx
import { ViewLabel } from './ViewLabel';
```

(b) The world's AU is on the computed state. The `world` binding already exists (`const world = state.planetaryState;`). Render `ViewLabel` inside `.viewport-frame`, after `<ModeRail ... />`, only when a world exists:

```tsx
      {world !== null && (
        <ViewLabel
          view={view}
          semiMajorAxisAu={world.configuration.orbital.semiMajorAxisAstronomicalUnits}
        />
      )}
```

- [ ] **Step 6: Add styles** — append to `src/index.css`:

```css
/* ── Viewport perspective label ── */
.view-label {
  position: absolute;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  text-align: center;
  font-family: var(--font-data);
  letter-spacing: var(--tracking-data);
  pointer-events: none;
  z-index: 2;
}
.view-label__name {
  color: var(--cyan-bright);
  font-size: var(--text-caption);
}
.view-label__note {
  color: var(--text-secondary);
  font-size: var(--text-micro);
}
```

- [ ] **Step 7: Verify + commit**

Run: `npm run typecheck && npm run lint && npx vitest run src/ui/ViewLabel.test.tsx src/ui/PlanetViewport.test.tsx`
Expected: clean; PASS.

```bash
git add src/ui/ViewLabel.tsx src/ui/ViewLabel.test.tsx src/ui/PlanetViewport.tsx src/index.css
git commit -m "feat(ui): viewport perspective label with honest System orbit note"
```

---

## Task 6: Final verification + visual gate + mark specs implemented

- [ ] **Step 1: Full suite + coverage + build**

Run: `npm run typecheck && npm run lint && npm run test:coverage 2>&1 | tail -4 && npm run build 2>&1 | tail -2`
Expected: all green; coverage gates pass (physics/translation 100% untouched; `cameraView.ts` covered ≥80%; `scene/**` excluded; new UI components covered by their tests); build succeeds.

- [ ] **Step 2: Manual visual check (VISUAL GATE)**

Run: `npm run dev`. Confirm:
- The rail shows three labeled buttons (OBSERVATION / SURFACE / SYSTEM); the active one is lit cyan.
- Clicking **Surface** smoothly moves the camera close to the planet (skimming terrain); clicking **Observation** eases back to the default framing.
- Clicking **System** pulls back and reveals the labeled orbit schematic (ring + star marker), with the bottom caption reading `ORBIT · <AU> · SCHEMATIC · NOT TO SCALE`.
- Transitions are smooth, not jarring; resizing the window keeps the framing correct.

Report what you see; iterate on the Surface proximity/tilt or the schematic ring size/position if needed (constants live in `src/renderer/cameraView.ts` and the schematic block of `planetRenderer.ts`).

- [ ] **Step 3: Mark both specs implemented** — append a "Status: Implemented" note to `docs/superpowers/specs/2026-06-14-viewport-perspectives-design.md` and to `docs/superpowers/specs/2026-06-13-mission-iconography-design.md` (whose rail evolved into this view-switcher), then commit:

```bash
git add docs/superpowers/specs/2026-06-14-viewport-perspectives-design.md docs/superpowers/specs/2026-06-13-mission-iconography-design.md
git commit -m "docs: mark viewport-perspectives and mission-iconography specs implemented"
```

---

## Self-Review

**Spec coverage:** §2 three views → Task 1 (`deriveCameraTarget` constants) + Task 2 (renderer applies them) + Task 5 (labels). §3.1 `PlanetView` → Task 1. §3.2 pure derivation → Task 1. §3.3 renderer `setView`/lerp/schematic → Task 2. §3.4 `ViewLabel` → Task 5. §3.5 rail control → Task 3. §3.6 viewport state → Task 4. §4 boundaries → only renderer/ui touched. §5 testing → Tasks 1/3/4/5 tests + Task 6 gate. §6 out-of-scope honored (no free camera, no multi-body, no URL persistence). §7 risks → addressed at the Task 6 gate. All covered.

**Placeholder scan:** No TBD/TODO; every code step shows complete code. The Task 3 isolation note (PlanetViewport won't typecheck until Task 4) is called out honestly with the resolution in the very next task, not hidden.

**Type consistency:** `PlanetView` (`'observation' | 'surface' | 'system'`) is defined in Task 1 and used identically in Tasks 2–5. `CameraTarget` field names (`positionX/Y/Z`, `schematicVisible`) match between Task 1's definition and Task 2's consumption. `PlanetRenderer.setView` signature matches between the interface (Task 2), the fake (Task 4), and the call site (Task 4). `ModeRail` props (`view`, `onSelectView`) match between Task 3 (definition) and Task 4 (call site). `ViewLabel` props (`view`, `semiMajorAxisAu`) match between Task 5's definition and its mount. CSS class names (`.mode-rail__item`, `.mode-rail__label`, `.view-label`, `.view-label__name`, `.view-label__note`) match between components and stylesheet. The `semiMajorAxisAstronomicalUnits` field name matches the existing `ViewportHud.tsx` usage.
