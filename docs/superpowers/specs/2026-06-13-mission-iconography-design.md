# Mission Iconography — Design Spec

**Date:** 2026-06-13
**Status:** Approved (design); pending implementation plan
**Scope:** Integrate the four space-themed SVG illustrations (`assets/*.svg`) into the console as themed UI chrome — a brand mark, a roadmap mode rail, and a small set of empty/loading states.

---

## 1. Goal

Bring the four illustrations — **rocket**, **cockpit**, **rover**, **shuttle-launch** — into the app as a single, coherent icon vocabulary that reinforces the "planetary explorer's console" identity, without compromising the charter's serious scientific tone (CLAUDE.md §1: "not a game, not a toy").

All four are **UI chrome only**. They are decoration and wayfinding, never physics. They live in `src/ui` / `src/assets`, never in the physics engine and never inside the physics-driven planet render (CLAUDE.md §4, §8). An icon of a rover is not a computed value.

## 2. Icon vocabulary (each icon → one meaning)

| Icon | Meaning | Appears in |
|---|---|---|
| **Rocket** | the app's signature / "working" | Header logo (replaces the ◈ glyph) + browser favicon + loading/processing indicator |
| **Cockpit** | *Observation* | Mode rail (active mode) + empty-viewport state |
| **Rover** | *Surface* | Mode rail (locked) + a no-data panel state |
| **Shuttle-launch** | *System* | Mode rail (locked) |

One meaning per icon; an icon is reused only where that one meaning applies. No icon is invented into a second unrelated role.

## 3. Source assets and the recolor problem

The four files in `assets/` are detailed, multi-path SVGRepo illustrations (800×800 viewBoxes) with **baked-in fills** (e.g. `#1d1d1b`). Two consequences:

1. **Wiring:** `assets/` at repo root is not bundled by Vite (no `public/`, no imports today). The four are copied — cleaned — into `src/assets/icons/` and imported as modules so the bundler hashes them and tree-shakes any unused ones.
2. **Recolor:** raw fills clash with the cyan-on-black console and cannot inherit theme color. Each cleaned copy has its body paths normalized to `fill="currentColor"` so CSS drives the color. Where a flat single-color silhouette reads poorly (likely the cockpit, possibly the rover at small sizes), interior detail paths are mapped to a muted secondary tone (a CSS variable) for a two-tone "engraved" look. The flat-vs-two-tone choice per icon is settled at a **visual gate** against the running app — the same verify-by-eye loop used for the planet shader, because rendered legibility cannot be judged from source.

The original `assets/*.svg` files are left in place (untouched source of truth); cleaned derivatives live in `src/assets/icons/`.

## 4. Architecture

All new code is pure UI chrome in `src/ui`, consuming cleaned assets from `src/assets/icons`. No store, physics, translation, renderer, or AI module changes.

### 4.1 `MissionIcon` — the shared primitive

A single component renders any of the four icons, themed by `currentColor` and a `state` styling hook.

- **Props:**
  - `name: 'rocket' | 'cockpit' | 'rover' | 'shuttle'`
  - `label: string` — accessible label (sets `aria-label` + `role="img"`; or `aria-hidden` when purely decorative alongside visible text)
  - `size?: number` — px (default e.g. 24)
  - `state?: 'active' | 'locked' | 'idle'` — drives color via CSS class (active = accent cyan, locked = dim gray, idle = low-opacity)
- **Mechanism:** the cleaned SVG is imported as a raw string (`import rocket from '../assets/icons/rocket.svg?raw'`) and rendered inline so `currentColor` and the secondary-tone variable apply. (Inline rendering of a trusted, static, local asset — not user input.) A small `Record<name, string>` maps names to the imported strings.
- **Responsibility:** rendering one icon at one size in one state. It knows nothing about modes, headers, or app state.

### 4.2 `ModeRail` — the roadmap glyphs

A slim vertical rail anchored to the left inside edge of the viewport, presented as an instrument panel, not game tabs.

- Renders three modes from a static UI constant (there is only one real mode today, so no store state is introduced):
  - **Observation** — `cockpit`, `state="active"`, lit.
  - **Surface** — `rover`, `state="locked"`.
  - **System** — `shuttle`, `state="locked"`.
- Locked items are `aria-disabled="true"`, visually dimmed, carry a subtle lock affordance, and show a "coming soon" tooltip (native `title` / accessible tooltip). They are not interactive beyond the tooltip — no dead click handlers.
- The active item is marked `aria-current` and is non-navigating (it is already the current view).
- Pure presentational component; the mode list is a module constant, easy to extend when a real second mode ships.

### 4.3 Header brand + favicon

- `SystemHeader.tsx`: replace the `◈` span (`SystemHeader.tsx:18`) with `<MissionIcon name="rocket" label="Project Exogenesis" state="idle" />` sized to match the current logo, themed to the accent color.
- Favicon: place a cleaned rocket at `public/favicon.svg` (Vite serves `public/` at the site root) and reference it from `index.html` with `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. This is the one cleaned copy that lives in `public/` (a static served path); the component copies live in `src/assets/icons/`.

### 4.4 States

Wired to conditions that already exist in the app:

- **Empty viewport** — during the brief initial `world === null` window (before the default world seeds; see `PlanetViewport.tsx:53`, `ViewportHud.tsx:52`), overlay a faint `cockpit` (`state="idle"`) with "Configure a world to begin."
- **Loading/processing** — the `scanning` pulse in `App.tsx` (`App.tsx:33,94`) gains a small pulsing `rocket` indicator while a recompute is in flight.
- **No-data panel** — the narration panel's pre-generation / empty state uses a faint `rover`. Exact attach point confirmed during planning (read `NarrationPanel.tsx` first); if no honest empty state exists there, this state is dropped rather than invented.

## 5. Styling

- Colors come from existing console theme tokens (the cyan accent, dim gray, background) — no new hard-coded colors beyond what the theme already defines. `MissionIcon` sets `color`; the SVG's `currentColor` follows.
- The secondary detail tone (for two-tone icons) is a single CSS custom property so it tracks the theme.
- Rail and brand sizes are small, fixed, and documented in CSS.

## 6. Testing (CLAUDE.md §11)

UI components get render + interaction tests; visual fidelity is verified by eye.

- **`MissionIcon`**: renders the requested icon (an `<svg>` is present), applies `aria-label`/`role` from `label`, applies the `state` class. (jsdom-friendly; no GL.)
- **`ModeRail`**: renders three modes; the active one is `aria-current` and not disabled; locked ones are `aria-disabled` and carry the tooltip text. Asserting semantics, not pixels.
- **Header**: existing `SystemHeader` / `App` tests stay green; add an assertion that the brand renders the rocket icon with its accessible name.
- **States**: a test that the empty-viewport overlay appears when no world is present and disappears once a world exists (using the existing injected-renderer test harness).
- **Visual gate** (manual `npm run dev`): brand mark, favicon, rail (active vs locked legibility), and each icon's flat-vs-two-tone recolor. Iterate here.

No physics, translation, store, or renderer coverage is affected; their gates are untouched.

## 7. Out of scope (YAGNI)

- No functional modes behind the locked rail (no surface/system views) — glyphs + tooltips only.
- No new store state, no routing, no animation beyond a simple loading pulse.
- No fourth invented mode; the rover/shuttle/cockpit/rocket meanings above are the whole set.
- No changes to the original `assets/*.svg` source files.
- No new runtime dependency (CLAUDE.md §17) — Vite's native `?raw` / asset imports suffice; no `vite-plugin-svgr`.

## 8. Risks & mitigations

- **Legibility of flattened multi-path icons** — mitigated by the per-icon flat-vs-two-tone decision at the visual gate; the cockpit and rover are the likely two-tone candidates.
- **Tone risk (playful icons in a serious console)** — mitigated by monochrome theming, the "locked instrument" framing of the rail, and keeping the rocket's most prominent appearance (header) static and small.
- **`?raw` inline rendering / lint** — confirm the project's eslint config during planning; if a no-danger rule is enabled, use a scoped, justified disable (trusted static asset) or fall back to a CSS `mask-image` silhouette for the affected placements.

## 9. Verification reality

As with the shader, rendered appearance can only be judged by running the app. Expect one or two visual round-trips to settle the recolor treatment and rail sizing. The work is staged so each step builds, tests green, and is viewable: (1) cleaned assets + `MissionIcon` + tests; (2) header brand + favicon; (3) mode rail; (4) states.
