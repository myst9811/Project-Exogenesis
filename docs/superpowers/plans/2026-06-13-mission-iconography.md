# Mission Iconography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the four space SVGs as themed UI chrome — a rocket brand mark + favicon, a `MissionIcon` primitive, a roadmap `ModeRail`, and empty/loading states — without touching physics, store, renderer, or AI logic.

**Architecture:** Cleaned, `currentColor`-themed copies of the four SVGs live in `src/assets/icons/`; a single `MissionIcon` component renders any of them inline (Vite `?raw`) at a given size/state. `ModeRail` and the brand/state placements consume only that primitive. All new code is pure presentational UI in `src/ui` (CLAUDE.md §4/§8 — chrome, never physics).

**Tech Stack:** TypeScript (strict), React, Vite (`?raw` asset import), Vitest + Testing Library, CSS custom properties.

---

## File Structure

- **Create** `src/assets/icons/{rocket,cockpit,rover,shuttle}.svg` — cleaned, `fill="currentColor"`, no prolog/comment/fixed-size. Imported via `?raw`.
- **Create** `public/favicon.svg` — cleaned rocket with a baked cyan fill (favicons can't rely on `currentColor`).
- **Create** `src/ui/MissionIcon.tsx` + `src/ui/MissionIcon.test.tsx` — the shared icon primitive.
- **Create** `src/ui/ModeRail.tsx` + `src/ui/ModeRail.test.tsx` — the roadmap mode rail.
- **Create** `src/ui/SystemHeader.test.tsx` — brand-mark assertion (no test exists today).
- **Modify** `src/ui/SystemHeader.tsx` — swap the `◈` glyph for the rocket brand.
- **Modify** `index.html` — link the favicon.
- **Modify** `src/ui/PlanetViewport.tsx` (+ `.test.tsx`) — mount `ModeRail`; add the empty-deck overlay.
- **Modify** `src/ui/NarrationPanel.tsx` (+ `.test.tsx`) — no-data rover hint in the idle state.
- **Modify** `src/ui/App.tsx` — CSS-driven loading rocket keyed on the existing `scanning` flag.
- **Modify** `src/index.css` — styles for `.mission-icon`, `.mode-rail`, `.viewport-empty`, `.narration-empty`, `.scan-indicator`.

Staged so each task builds, tests green, and is viewable: (1) assets + primitive; (2) brand + favicon; (3) mode rail; (4) states; (5) final verification + visual gate.

---

## Task 1: Cleaned icon assets + `MissionIcon` primitive

**Files:**
- Create: `src/assets/icons/{rocket,cockpit,rover,shuttle}.svg`, `public/favicon.svg`
- Create: `src/ui/MissionIcon.tsx`, `src/ui/MissionIcon.test.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Generate the cleaned assets** — run this one-off transform from the repo root (it reads the originals in `assets/`, leaves them untouched, and writes cleaned copies):

```bash
node --input-type=module -e '
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
mkdirSync("src/assets/icons", { recursive: true });
const map = {
  "space-rocket-svgrepo-com": "rocket",
  "space-cockpit-svgrepo-com": "cockpit",
  "space-rover-1-svgrepo-com": "rover",
  "space-shuttle-launch-svgrepo-com": "shuttle",
};
for (const [src, name] of Object.entries(map)) {
  let s = readFileSync(`assets/${src}.svg`, "utf8");
  s = s.replace(/<\?xml[^>]*\?>/g, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/\s(width|height)="[^"]*"/g, "");
  s = s.replace(/fill="#[0-9a-fA-F]{3,8}"/g, "fill=\"currentColor\"");
  s = s.replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, "fill:currentColor");
  if (!/<svg[^>]*\sfill=/.test(s)) s = s.replace(/<svg/, "<svg fill=\"currentColor\"");
  writeFileSync(`src/assets/icons/${name}.svg`, s.trim() + "\n");
}
mkdirSync("public", { recursive: true });
const fav = readFileSync("src/assets/icons/rocket.svg", "utf8").replace(/currentColor/g, "#4fc3e8");
writeFileSync("public/favicon.svg", fav);
console.log("done");
'
```

- [ ] **Step 2: Verify no baked fills remain** — every cleaned file should be free of hex fills:

Run: `grep -lE 'fill="#|fill:\s*#' src/assets/icons/*.svg || echo "clean"`
Expected: `clean` (no file listed). Also confirm each begins with `<svg`: `head -c 5 src/assets/icons/rover.svg` → `<svg`.

- [ ] **Step 3: Write the failing test** — `src/ui/MissionIcon.test.tsx`:

```tsx
/**
 * @module ui/MissionIcon.test
 * @vitest-environment jsdom
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MissionIcon } from './MissionIcon';

afterEach(cleanup);

describe('MissionIcon', () => {
  it('renders the named icon as an inline svg with the state class and label', () => {
    const { container } = render(<MissionIcon name="rover" label="Surface" state="locked" />);
    const wrapper = container.querySelector('.mission-icon');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains('mission-icon--locked')).toBe(true);
    expect(wrapper?.getAttribute('aria-label')).toBe('Surface');
    expect(wrapper?.getAttribute('role')).toBe('img');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('is decorative (aria-hidden, no role) when no label is given', () => {
    const { container } = render(<MissionIcon name="rocket" />);
    const wrapper = container.querySelector('.mission-icon');
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper?.getAttribute('role')).toBeNull();
  });
});
```

- [ ] **Step 4: Run to verify failure**

Run: `npx vitest run src/ui/MissionIcon.test.tsx`
Expected: FAIL — `./MissionIcon` not found.

- [ ] **Step 5: Implement `MissionIcon`** — `src/ui/MissionIcon.tsx`:

```tsx
/**
 * @module ui/MissionIcon
 *
 * Renders one of the four cleaned space icons inline, themed by `currentColor`
 * (CSS sets the color via the `state` class). Pure chrome — knows nothing of
 * physics, modes, or app state. The SVGs are trusted, static, local assets
 * imported as raw strings, so inline rendering is safe.
 */

import type { CSSProperties, JSX } from 'react';

import cockpit from '../assets/icons/cockpit.svg?raw';
import rocket from '../assets/icons/rocket.svg?raw';
import rover from '../assets/icons/rover.svg?raw';
import shuttle from '../assets/icons/shuttle.svg?raw';

export type MissionIconName = 'rocket' | 'cockpit' | 'rover' | 'shuttle';
export type MissionIconState = 'active' | 'locked' | 'idle';

const SOURCES: Record<MissionIconName, string> = { rocket, cockpit, rover, shuttle };

export function MissionIcon({
  name,
  label,
  size = 24,
  state = 'idle',
}: {
  name: MissionIconName;
  /** Accessible name. Omit to render the icon decoratively (aria-hidden). */
  label?: string;
  size?: number;
  state?: MissionIconState;
}): JSX.Element {
  const style: CSSProperties = { width: size, height: size };
  const a11y =
    label !== undefined
      ? ({ role: 'img', 'aria-label': label } as const)
      : ({ 'aria-hidden': true } as const);
  return (
    <span
      className={`mission-icon mission-icon--${state}`}
      style={style}
      {...a11y}
      dangerouslySetInnerHTML={{ __html: SOURCES[name] }}
    />
  );
}
```

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run src/ui/MissionIcon.test.tsx`
Expected: PASS (both cases).

- [ ] **Step 7: Add styles** — append to `src/index.css`:

```css
/* ── Mission icons (UI chrome) ── */
.mission-icon {
  display: inline-flex;
  line-height: 0;
  color: var(--cyan-mid);
}
.mission-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}
.mission-icon--active {
  color: var(--cyan-bright);
  filter: drop-shadow(0 0 6px var(--cyan-glow));
}
.mission-icon--locked {
  color: var(--text-ghost);
}
.mission-icon--idle {
  color: var(--cyan-mid);
}
```

- [ ] **Step 8: Verify + commit**

Run: `npm run typecheck && npm run lint && npx vitest run src/ui/MissionIcon.test.tsx`
Expected: clean; PASS.

```bash
git add src/assets/icons public/favicon.svg src/ui/MissionIcon.tsx src/ui/MissionIcon.test.tsx src/index.css
git commit -m "feat(ui): add cleaned mission icons and the MissionIcon primitive"
```

---

## Task 2: Rocket brand mark + favicon

**Files:**
- Modify: `src/ui/SystemHeader.tsx`
- Create: `src/ui/SystemHeader.test.tsx`
- Modify: `index.html`

- [ ] **Step 1: Write the failing test** — `src/ui/SystemHeader.test.tsx`:

```tsx
/**
 * @module ui/SystemHeader.test
 * @vitest-environment jsdom
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { createAppStores } from '../store';
import { StoresProvider } from './StoresProvider';
import { SystemHeader } from './SystemHeader';

afterEach(cleanup);

describe('SystemHeader', () => {
  it('renders the rocket brand mark in the header-left', () => {
    const { container } = render(
      <StoresProvider stores={createAppStores()}>
        <SystemHeader />
      </StoresProvider>,
    );
    const brand = container.querySelector('.header-left .mission-icon');
    expect(brand).not.toBeNull();
    expect(brand?.querySelector('svg')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/SystemHeader.test.tsx`
Expected: FAIL — no `.mission-icon` in the header.

- [ ] **Step 3: Swap the glyph** — in `src/ui/SystemHeader.tsx`, add the import and replace the logo span. Add to imports:

```tsx
import { MissionIcon } from './MissionIcon';
```

Replace:

```tsx
        <span className="system-logo" aria-hidden="true">
          ◈
        </span>
```

with:

```tsx
        <span className="system-logo">
          <MissionIcon name="rocket" size={22} state="active" />
        </span>
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/SystemHeader.test.tsx`
Expected: PASS.

- [ ] **Step 5: Link the favicon** — in `index.html`, add inside `<head>` after the `<title>` line:

```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 6: Verify + commit**

Run: `npm run typecheck && npm run lint && npx vitest run src/ui/SystemHeader.test.tsx && npm run build 2>&1 | tail -2`
Expected: clean; PASS; build succeeds (favicon copied into `dist/`).

```bash
git add src/ui/SystemHeader.tsx src/ui/SystemHeader.test.tsx index.html
git commit -m "feat(ui): rocket brand mark in the header and SVG favicon"
```

---

## Task 3: `ModeRail` roadmap glyphs

**Files:**
- Create: `src/ui/ModeRail.tsx`, `src/ui/ModeRail.test.tsx`
- Modify: `src/ui/PlanetViewport.tsx`, `src/index.css`

- [ ] **Step 1: Write the failing test** — `src/ui/ModeRail.test.tsx`:

```tsx
/**
 * @module ui/ModeRail.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ModeRail } from './ModeRail';

afterEach(cleanup);

describe('ModeRail', () => {
  it('marks Observation active and the other modes locked', () => {
    render(<ModeRail />);
    const observation = screen.getByTitle('Observation (active)');
    expect(observation.getAttribute('aria-current')).toBe('true');
    expect(observation.getAttribute('aria-disabled')).toBeNull();
    expect(screen.getByTitle('Surface — coming soon').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByTitle('System — coming soon').getAttribute('aria-disabled')).toBe('true');
  });

  it('renders all three labelled mode icons', () => {
    render(<ModeRail />);
    expect(screen.getByLabelText('Observation')).not.toBeNull();
    expect(screen.getByLabelText('Surface')).not.toBeNull();
    expect(screen.getByLabelText('System')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/ModeRail.test.tsx`
Expected: FAIL — `./ModeRail` not found.

- [ ] **Step 3: Implement `ModeRail`** — `src/ui/ModeRail.tsx`:

```tsx
/**
 * @module ui/ModeRail
 *
 * The exploration mode rail overlaid on the viewport: the current Observation
 * mode is active; Surface and System are roadmap capabilities, shown locked
 * (CLAUDE.md §16). Presentational only — the mode list is a static constant;
 * no store state exists because only one mode is real today.
 */

import type { JSX } from 'react';

import { MissionIcon, type MissionIconName } from './MissionIcon';

interface ExplorationMode {
  id: string;
  label: string;
  icon: MissionIconName;
  available: boolean;
}

const MODES: readonly ExplorationMode[] = [
  { id: 'observation', label: 'Observation', icon: 'cockpit', available: true },
  { id: 'surface', label: 'Surface', icon: 'rover', available: false },
  { id: 'system', label: 'System', icon: 'shuttle', available: false },
];

export function ModeRail(): JSX.Element {
  return (
    <div className="mode-rail" role="group" aria-label="exploration modes">
      {MODES.map((mode) => (
        <div
          key={mode.id}
          className={`mode-rail__item ${mode.available ? 'is-active' : 'is-locked'}`}
          aria-current={mode.available ? 'true' : undefined}
          aria-disabled={mode.available ? undefined : 'true'}
          title={mode.available ? `${mode.label} (active)` : `${mode.label} — coming soon`}
        >
          <MissionIcon
            name={mode.icon}
            label={mode.label}
            size={26}
            state={mode.available ? 'active' : 'locked'}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/ModeRail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Mount it in the viewport** — in `src/ui/PlanetViewport.tsx`, add the import:

```tsx
import { ModeRail } from './ModeRail';
```

and add `<ModeRail />` inside the `.viewport-frame`, before `<ViewportHud />`:

```tsx
    <div className="viewport-frame">
      <canvas ref={canvasRef} className="planet-viewport" aria-label="planet view" />
      <ModeRail />
      <ViewportHud />
    </div>
```

- [ ] **Step 6: Add styles** — append to `src/index.css`:

```css
/* ── Mode rail (roadmap glyphs) ── */
.mode-rail {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  z-index: 2;
}
.mode-rail__item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  background: rgba(6, 13, 26, 0.55);
}
.mode-rail__item.is-active {
  border-color: var(--border-active);
  box-shadow: 0 0 10px var(--cyan-glow);
}
.mode-rail__item.is-locked {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 7: Verify the existing viewport test still passes**

Run: `npx vitest run src/ui/PlanetViewport.test.tsx src/ui/ModeRail.test.tsx`
Expected: PASS (the injected-renderer test is unaffected; `ModeRail` adds no GL).

- [ ] **Step 8: Verify + commit**

Run: `npm run typecheck && npm run lint`
Expected: clean.

```bash
git add src/ui/ModeRail.tsx src/ui/ModeRail.test.tsx src/ui/PlanetViewport.tsx src/index.css
git commit -m "feat(ui): roadmap mode rail (Observation active, Surface/System locked)"
```

---

## Task 4: Empty / no-data / loading states

**Files:**
- Modify: `src/ui/PlanetViewport.tsx` (+ `.test.tsx`) — empty-deck overlay
- Modify: `src/ui/NarrationPanel.tsx` (+ `.test.tsx`) — no-data rover
- Modify: `src/ui/App.tsx` — loading rocket
- Modify: `src/index.css`

### 4a — Empty-deck overlay

- [ ] **Step 1: Write the failing test** — add to `src/ui/PlanetViewport.test.tsx` (inside the existing `describe`, and add `screen` to the testing-library import):

```tsx
  it('shows the empty-deck overlay when no world is computed', () => {
    const { renderer } = fakeRenderer();
    render(
      <StoresProvider stores={createAppStores()}>
        <PlanetViewport createRenderer={() => renderer} />
      </StoresProvider>,
    );
    expect(screen.getByText('Configure a world to begin.')).not.toBeNull();
  });
```

Update the import line at the top of the file to include `screen`:

```tsx
import { cleanup, render, screen, waitFor } from '@testing-library/react';
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/PlanetViewport.test.tsx`
Expected: FAIL — text not found (no world committed, but no overlay yet).

- [ ] **Step 3: Add the overlay** — in `src/ui/PlanetViewport.tsx`, add the `MissionIcon` import:

```tsx
import { MissionIcon } from './MissionIcon';
```

and render the overlay when `world === null` (the `world` binding already exists at `PlanetViewport.tsx:53`). Update the returned JSX:

```tsx
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/PlanetViewport.test.tsx`
Expected: PASS (both the existing uniforms test and the new overlay test).

### 4b — No-data rover in narration

- [ ] **Step 5: Write the failing test** — add to `src/ui/NarrationPanel.test.tsx` (reuse its existing render helper/imports; this assumes a fake client is available as the other tests construct one — match the existing pattern in that file):

```tsx
  it('shows the no-data hint before any narration is generated', () => {
    render(<NarrationPanel client={fakeClient()} />);
    expect(screen.getByText('No field notes yet — request a narration above.')).not.toBeNull();
  });
```

> Before writing this, read `src/ui/NarrationPanel.test.tsx` to reuse its existing `fakeClient`/render setup and `screen` import rather than redefining them.

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run src/ui/NarrationPanel.test.tsx`
Expected: FAIL — hint text not found.

- [ ] **Step 7: Add the hint** — in `src/ui/NarrationPanel.tsx`, add the import:

```tsx
import { MissionIcon } from './MissionIcon';
```

and render the hint in the idle, no-content state. Immediately after the `narration-actions` toolbar `</div>` (before the content/error rendering), add:

```tsx
        {status === 'idle' && content === null && (
          <div className="narration-empty">
            <MissionIcon name="rover" size={36} state="idle" />
            <span>No field notes yet — request a narration above.</span>
          </div>
        )}
```

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run src/ui/NarrationPanel.test.tsx`
Expected: PASS.

### 4c — Loading rocket

- [ ] **Step 9: Add the indicator** — in `src/ui/App.tsx`, add the import:

```tsx
import { MissionIcon } from './MissionIcon';
```

and render a CSS-driven indicator as the first child inside the `.console` div (it is always present; CSS reveals it only while `.console.scanning`):

```tsx
      <div className={scanning ? 'console scanning' : 'console'}>
        <div className="scan-indicator" aria-hidden="true">
          <MissionIcon name="rocket" size={16} state="active" />
        </div>
        <SystemHeader />
```

- [ ] **Step 10: Add styles** — append to `src/index.css`:

```css
/* ── Icon-driven states ── */
.viewport-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: var(--text-body);
}
.narration-empty {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-secondary);
  font-size: var(--text-caption);
  padding: 0.6rem 0;
}
.scan-indicator {
  position: absolute;
  top: 0.6rem;
  right: 1.2rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 5;
}
.console.scanning .scan-indicator {
  opacity: 1;
  animation: scan-pulse 0.8s ease-in-out;
}
@keyframes scan-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.25);
  }
}
```

- [ ] **Step 11: Verify + commit**

Run: `npm run typecheck && npm run lint && npx vitest run src/ui/PlanetViewport.test.tsx src/ui/NarrationPanel.test.tsx src/ui/App.test.tsx`
Expected: clean; all PASS.

```bash
git add src/ui/PlanetViewport.tsx src/ui/PlanetViewport.test.tsx src/ui/NarrationPanel.tsx src/ui/NarrationPanel.test.tsx src/ui/App.tsx src/index.css
git commit -m "feat(ui): icon-driven empty-deck, no-data, and loading states"
```

---

## Task 5: Final verification + visual gate + mark spec implemented

- [ ] **Step 1: Full suite + coverage + build**

Run: `npm run typecheck && npm run lint && npm run test:coverage 2>&1 | tail -4 && npm run build 2>&1 | tail -2`
Expected: all green; coverage gates pass (physics/translation 100% untouched; new `MissionIcon`/`ModeRail` covered by their tests); build succeeds and emits `dist/favicon.svg`.

- [ ] **Step 2: Manual visual check (VISUAL GATE)**

Run: `npm run dev`. Confirm:
- The header shows the rocket brand mark (cyan); the browser tab shows the rocket favicon.
- The viewport's left edge shows the mode rail: Observation lit, Surface/System dimmed with "coming soon" tooltips on hover.
- Each icon is legible at its size. **If any icon (likely the cockpit or rover) reads as an indistinct blob**, two-tone it: in `src/assets/icons/<name>.svg`, change the interior detail paths' `fill="currentColor"` to `fill="var(--void-panel)"` (or remove those fills) so the silhouette gains internal contrast, and re-check. Record which icons needed it.
- The narration panel shows the rover "no field notes yet" hint before generating.
- Changing a parameter briefly flashes the loading rocket (top-right).

Report what you see; iterate on recolor/sizing if needed.

- [ ] **Step 3: Mark the spec implemented** — append to `docs/superpowers/specs/2026-06-13-mission-iconography-design.md`:

```markdown

---

## Status: Implemented (2026-06-13)

Rocket brand mark + SVG favicon, the `MissionIcon` primitive, the Observation/Surface/System mode rail, and the empty-deck / no-data / loading states all shipped and visually verified. Pure UI chrome; no physics, store, renderer, or AI changes. All tests green; coverage gates pass; build clean.
```

```bash
git add docs/superpowers/specs/2026-06-13-mission-iconography-design.md
git commit -m "docs: mark mission-iconography spec implemented"
```

---

## Self-Review

**Spec coverage:** §2 vocabulary → Tasks 2 (rocket brand/favicon), 3 (cockpit/rover/shuttle rail), 4 (cockpit empty, rover no-data, rocket loading). §3 wiring + recolor → Task 1 (cleaning, `currentColor`, `?raw`) + Task 5 gate (two-tone fallback). §4.1 `MissionIcon` → Task 1. §4.2 `ModeRail` → Task 3. §4.3 header + favicon → Task 2. §4.4 states → Task 4. §5 styling (theme tokens) → CSS in Tasks 1/3/4. §6 testing → tests in Tasks 1–4 + gate in Task 5. §7 out-of-scope honored (no functional modes, no store state, no new dep). All covered.

**Placeholder scan:** No TBD/TODO. The one deferral (NarrationPanel's existing `fakeClient`/`screen` setup) is an explicit "read the file and reuse the pattern" instruction with the exact assertion given — not a hidden gap. The two-tone recolor is a conditional gate step with the exact edit specified, not a placeholder.

**Type consistency:** `MissionIconName` (`'rocket' | 'cockpit' | 'rover' | 'shuttle'`) and `MissionIconState` (`'active' | 'locked' | 'idle'`) are defined in Task 1 and used identically in Tasks 2–4. `MissionIcon` prop names (`name`, `label`, `size`, `state`) match across all call sites. CSS class names (`.mission-icon`, `.mission-icon--{state}`, `.mode-rail`, `.viewport-empty`, `.narration-empty`, `.scan-indicator`) match between the components and the stylesheet.
