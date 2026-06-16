# Parameter Explainer Tooltips — Design Spec

**Date:** 2026-06-16
**Branch:** `feature/parameter-tooltips`
**Status:** Approved

---

## Problem

Project Exogenesis exposes 18 input parameters and 8 output readout cards. Every label — "Semi-major axis (AU)", "Eccentricity", "CH₄ (kPa)", "Escape Velocity" — is opaque to a non-scientist. There is currently no in-context explanation of what any parameter means, what range is physically reasonable, or how it compares to familiar reference points.

---

## Goal

Add a floating tooltip to every parameter label and every output readout label, giving non-scientists an immediate, deterministic, physics-honest explanation of what they are looking at — without leaving the console.

---

## Decisions

| Question | Decision |
|---|---|
| Visual style | Floating tooltip card |
| Trigger | ⓘ icon fades in on row hover; hovering the ⓘ opens the tooltip |
| Scope | All 18 input parameters + all 8 output readout labels |
| Input tooltip content | Definition + Analogy + Known solar-system anchors |
| Output tooltip content | Definition only (ReadoutCard already provides translation + Earth comparison) |
| Content source | Static authored — one data file, no AI, fully deterministic |

---

## Architecture

### New files

```
src/ui/
├── Tooltip.tsx                      — floating tooltip display component
└── tooltips/
    ├── types.ts                     — ParameterTooltip type
    └── parameterTooltips.ts         — all tooltip content, keyed by parameter
```

### Modified files

```
src/ui/
├── NumberField.tsx                  — add optional tooltip prop
├── InputPanels.tsx                  — pass tooltip to NumberField; add ⓘ to .select-field labels
├── ReadoutCard.tsx                  — add optional tooltip prop on the label
├── WorldReadouts.tsx                — pass tooltip to each ReadoutCard
└── index.css                        — tooltip styles
```

`SpectralClassSelector.tsx` is **not modified** — its ⓘ icon is added by `InputPanels` alongside the existing `<span className="field-label">Spectral class</span>`. Same for the composition `<select>`.

### No changes to

- `src/physics/` — tooltip data is UI metadata, not simulation state
- `src/translation/` — tooltips are independent of computed values
- `src/ai/` — content is static, no AI involvement
- `src/types/` — tooltip types live in `src/ui/tooltips/types.ts`

---

## Types

```typescript
// src/ui/tooltips/types.ts

export interface TooltipAnchor {
  label: string;    // e.g. "Earth", "Venus", "Jupiter"
  value: string;    // e.g. "1.00 AU", "9.81 m/s²"
  isEarth?: boolean; // renders a ✓ marker
}

export interface ParameterTooltip {
  title: string;
  definition: string;
  analogy?: string;          // amber italic — makes the abstract physical
  anchors?: TooltipAnchor[]; // known solar-system reference values
}

// All valid keys for parameterTooltips.ts
export type ParameterTooltipKey =
  // Inputs
  | 'spectralClass' | 'stellarMass' | 'stellarAge'
  | 'semiMajorAxis' | 'eccentricity'
  | 'planetMass' | 'planetRadius' | 'compositionClass'
  | 'rotationPeriod' | 'axialTilt'
  | 'pressureN2' | 'pressureO2' | 'pressureCO2' | 'pressureH2O'
  | 'pressureCH4' | 'pressureAr' | 'pressureHe' | 'pressureH2'
  // Outputs
  | 'gravity' | 'surfaceTemperature' | 'habitability'
  | 'atmosphericPressure' | 'atmosphere'
  | 'escapeVelocity' | 'dayLength' | 'yearLength';

// parameterTooltips.ts exports:
// export const PARAMETER_TOOLTIPS: Record<ParameterTooltipKey, ParameterTooltip>
```

---

## Tooltip Component

```
src/ui/Tooltip.tsx
```

**Props:**
```typescript
{
  tooltip: ParameterTooltip;
  children: ReactNode; // wraps whatever triggers it (e.g. the ⓘ icon)
}
```

**Behaviour:**
- Renders a `<span>` wrapper around `children`
- On hover/focus of `children`, shows the floating card positioned below-left
- Card contains: title (Rajdhani caps), definition, optional analogy (amber italic), optional anchors (Space Mono, dimmed)
- Dismisses on mouse-leave / blur
- Uses `role="tooltip"` and `aria-describedby` for accessibility
- No physics logic, no store access — pure display

**Positioning:**
- Default: below the trigger, left-aligned
- Clamps to viewport so it never clips off-screen edges

---

## Trigger Mechanism

`NumberField` and the label elements in `InputPanels` gain a ⓘ icon that:

1. Is **invisible at rest** (`opacity: 0`, `pointer-events: none`)
2. **Fades in** when the parent row is hovered (`opacity: 1`, `pointer-events: auto`)
3. Opening the tooltip requires hovering the ⓘ icon itself — one extra gesture keeps the tooltip from firing on every accidental row pass

CSS uses parent hover selectors — no JavaScript state needed for the reveal:
- `.tactical-field:hover .tooltip-trigger` — for `NumberField` rows
- `.select-field:hover .tooltip-trigger` — for spectral class and composition selects

For `ReadoutCard`, the ⓘ appears beside the `readout-label` text and follows the same hover-reveal pattern.

---

## Content Tiers

### Input parameters — Full (Definition + Analogy + Anchors)

Every `NumberField`, `SpectralClassSelector`, and composition `<select>` in `InputPanels`.

| Parameter | Anchors |
|---|---|
| Spectral class | O/B/A/F/G/K/M with temperature + colour |
| Stellar mass | Sun: 1.0 M☉, Proxima Centauri: 0.12, Sirius: 2.1 |
| Stellar age | Sun: 4.6 Gyr, typical MS lifetime by class |
| Semi-major axis | Venus: 0.72, Earth: 1.00 ✓, Mars: 1.52 AU |
| Eccentricity | Earth: 0.017, Mars: 0.093, Mercury: 0.206 |
| Planetary mass | Mars: 0.11, Earth: 1.0 ✓, Neptune: 17.1 M⊕ |
| Planetary radius | Mars: 0.53, Earth: 1.0 ✓, Neptune: 3.9 R⊕ |
| Composition class | Silicate / Iron / Icy / Carbon — what each implies |
| Rotation period | Earth: 24 h, Venus: 5832 h, Jupiter: 10 h |
| Axial tilt | Earth: 23.4° → seasons, Mercury: 0.03° → none, Uranus: 97.8° |
| N₂ partial pressure | Earth: 78.1 kPa |
| O₂ partial pressure | Earth: 21.2 kPa (breathable threshold ~16 kPa) |
| CO₂ partial pressure | Earth: 0.04 kPa, Venus: 9,200 kPa |
| H₂O partial pressure | Earth: ~1–3 kPa (variable) |
| CH₄ partial pressure | Earth: trace; Titan: significant |
| Ar partial pressure | Earth: 0.96 kPa |
| He partial pressure | Earth: 0.0005 kPa |
| H₂ partial pressure | Earth: trace; gas giants: dominant |

### Output readouts — Definition only

Every `ReadoutCard` in `WorldReadouts`.

| Readout | Definition covers |
|---|---|
| Gravity | What surface gravity is; how mass and radius determine it |
| Surface Temperature | Equilibrium temperature; energy balance |
| Habitability | What the score measures; what limits it |
| Atmospheric Pressure | What pressure means at a surface; how it relates to breathability |
| Atmosphere | What the composition bar represents |
| Escape Velocity | The speed threshold; why it matters for atmosphere retention |
| Day Length | Rotation period; tidal locking risk |
| Year Length | Orbital period; seasons and energy variation |

---

## Styling

Follows the existing Deep Field Protocol design tokens.

```css
.tooltip-card {
  background: var(--void-raised);          /* #0a1525 */
  border: 1px solid var(--border-active);  /* cyan-tinted */
  border-radius: 5px;
  padding: 12px 14px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 12px var(--cyan-glow);
  max-width: 260px;
  z-index: 100;
}

.tooltip-title   { font: Rajdhani caps, var(--text-caption), --cyan-bright }
.tooltip-def     { font: Space Grotesk, var(--text-body), --text-primary }
.tooltip-analogy { font: Space Grotesk italic, var(--text-body), --amber-bright }
.tooltip-anchors { font: Space Mono, var(--text-caption), --cyan-mid }
```

The ⓘ icon is a 14×14px circle using `--border-active` and `--cyan-bright`, matching existing icon language in the console.

---

## Accessibility

- ⓘ is a `<button type="button">` (keyboard focusable)
- Tooltip element has `role="tooltip"` and a unique `id`
- ⓘ button has `aria-describedby` pointing to the tooltip `id`
- Tooltip opens on both hover and focus; closes on blur and Escape

---

## Testing

- `Tooltip.tsx` — renders tooltip content; shows on hover/focus; hides on mouse-leave/blur; clamps to viewport
- `NumberField.tsx` — renders ⓘ when `tooltip` prop is provided; ⓘ is hidden at rest; fades in on row hover
- `ReadoutCard.tsx` — same as NumberField
- `parameterTooltips.ts` — each entry has a `title` and `definition`; input entries have `analogy` and `anchors`; output entries have no anchors (lint/type check enforces this)
- No physics tests required — tooltip data is UI metadata

---

## Out of Scope

- AI-generated or dynamic tooltip content
- Tooltip content that changes based on current simulation state
- Tooltips on any element outside `InputPanels` and `WorldReadouts`
- Mobile / touch-specific tooltip trigger (hover-only for now)
