# Parameter Tooltips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating tooltip to every input parameter label and every output readout label so non-scientists can understand what each parameter means.

**Architecture:** A static data file (`parameterTooltips.ts`) holds all 26 tooltip entries keyed by `ParameterTooltipKey`. A new `Tooltip` React component renders the ⓘ trigger button and floating card. `NumberField` and `ReadoutCard` each receive an optional `tooltip` prop; `InputPanels` and `WorldReadouts` pass the right entry from the data file to each field.

**Tech Stack:** React 19, TypeScript strict, Vitest + @testing-library/react, CSS custom properties (existing Deep Field Protocol tokens).

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `src/ui/tooltips/types.ts` | `ParameterTooltip`, `TooltipAnchor`, `ParameterTooltipKey` types |
| Create | `src/ui/tooltips/parameterTooltips.ts` | All 26 authored tooltip entries |
| Create | `src/ui/Tooltip.tsx` | ⓘ trigger button + floating card component |
| Create | `src/ui/Tooltip.test.tsx` | Component tests |
| Modify | `src/ui/NumberField.tsx` | Add optional `tooltip` prop |
| Modify | `src/ui/NumberField.test.tsx` | Tests for tooltip prop |
| Modify | `src/ui/ReadoutCard.tsx` | Add optional `tooltip` prop; restructure header |
| Modify | `src/ui/ReadoutCard.test.tsx` | Tests for tooltip prop |
| Modify | `src/ui/InputPanels.tsx` | Wire tooltips for all 18 input parameters |
| Modify | `src/ui/InputPanels.test.tsx` | Verify tooltip triggers render |
| Modify | `src/ui/WorldReadouts.tsx` | Wire tooltips for all 8 output readouts |
| Modify | `src/ui/WorldReadouts.test.tsx` | Verify tooltip triggers render |
| Modify | `src/index.css` | Tooltip styles |

---

## Task 1: Types

**Files:**
- Create: `src/ui/tooltips/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/ui/tooltips/types.ts

export interface TooltipAnchor {
  label: string;
  value: string;
  isEarth?: boolean;
}

export interface ParameterTooltip {
  title: string;
  definition: string;
  analogy?: string;
  anchors?: TooltipAnchor[];
}

export type ParameterTooltipKey =
  | 'spectralClass' | 'stellarMass' | 'stellarAge'
  | 'semiMajorAxis' | 'eccentricity'
  | 'planetMass' | 'planetRadius' | 'compositionClass'
  | 'rotationPeriod' | 'axialTilt'
  | 'pressureN2' | 'pressureO2' | 'pressureCO2' | 'pressureH2O'
  | 'pressureCH4' | 'pressureAr' | 'pressureHe' | 'pressureH2'
  | 'gravity' | 'surfaceTemperature' | 'habitability'
  | 'atmosphericPressure' | 'atmosphere'
  | 'escapeVelocity' | 'dayLength' | 'yearLength';
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/tooltips/types.ts
git commit -m "types(ui): add ParameterTooltip and ParameterTooltipKey"
```

---

## Task 2: Tooltip Data

**Files:**
- Create: `src/ui/tooltips/parameterTooltips.ts`

- [ ] **Step 1: Create the data file**

```typescript
// src/ui/tooltips/parameterTooltips.ts

/**
 * @module ui/tooltips/parameterTooltips
 *
 * Static authored tooltip content for every input parameter and output
 * readout. Content is deterministic — no AI, no runtime computation.
 * Inputs receive definition + analogy + solar-system anchors.
 * Outputs receive definition only (ReadoutCard already contextualises the value).
 */

import type { ParameterTooltip, ParameterTooltipKey } from './types';

export const PARAMETER_TOOLTIPS: Record<ParameterTooltipKey, ParameterTooltip> = {

  // ── Stellar inputs ──────────────────────────────────────────────────────

  spectralClass: {
    title: 'Spectral Class',
    definition:
      'A letter code classifying a star by its surface temperature and colour. O and B stars burn hot and blue; G stars (like our Sun) are yellow-white; K and M stars are cooler and red.',
    analogy:
      'Think of it as the star\'s colour temperature — the same scale as a metal rod heated from dull red to white-hot to blue.',
    anchors: [
      { label: 'M — Red dwarf', value: '< 3,700 K · dim red' },
      { label: 'K — Orange', value: '3,700–5,200 K' },
      { label: 'G — Sun', value: '5,200–6,000 K', isEarth: true },
      { label: 'F — White-yellow', value: '6,000–7,500 K' },
      { label: 'A — White', value: '7,500–10,000 K' },
      { label: 'B — Blue', value: '10,000–30,000 K' },
    ],
  },

  stellarMass: {
    title: 'Stellar Mass',
    definition:
      'The mass of the host star relative to our Sun (1 M☉ = solar mass). Mass determines a star\'s luminosity, surface temperature, lifespan, and the width of its habitable zone.',
    analogy:
      'A heavier star burns its fuel faster — like a larger bonfire that blazes brighter but burns out sooner.',
    anchors: [
      { label: 'Proxima Centauri', value: '0.12 M☉' },
      { label: 'Sun', value: '1.0 M☉', isEarth: true },
      { label: 'Sirius A', value: '2.1 M☉' },
      { label: 'Rigel', value: '21 M☉' },
    ],
  },

  stellarAge: {
    title: 'Stellar Age',
    definition:
      'How long the star has been on the main sequence, in billions of years (Gyr). Older stars have had more time to settle, potentially giving orbiting planets more time to develop complex chemistry.',
    analogy:
      'A younger star is more active and flares more unpredictably — like a young fire throwing sparks before it settles into steady burning.',
    anchors: [
      { label: 'Sun', value: '4.6 Gyr', isEarth: true },
      { label: 'Proxima Centauri', value: '~4.9 Gyr' },
      { label: 'TRAPPIST-1', value: '~7.6 Gyr' },
    ],
  },

  // ── Orbital inputs ──────────────────────────────────────────────────────

  semiMajorAxis: {
    title: 'Semi-Major Axis',
    definition:
      'The average distance between a planet and its star, in Astronomical Units (1 AU = Earth–Sun distance). This is the primary driver of how much stellar energy the planet receives.',
    analogy:
      'How far from the campfire you sit — too close and you burn, too far and you freeze.',
    anchors: [
      { label: 'Venus', value: '0.72 AU' },
      { label: 'Earth', value: '1.00 AU', isEarth: true },
      { label: 'Mars', value: '1.52 AU' },
      { label: 'Jupiter', value: '5.20 AU' },
    ],
  },

  eccentricity: {
    title: 'Orbital Eccentricity',
    definition:
      'How elliptical the orbit is, from 0 (perfect circle) to 1 (escape trajectory). Higher eccentricity means the planet swings much closer and farther from its star each year, driving seasonal temperature extremes.',
    analogy:
      'A circular orbit is a merry-go-round; a high-eccentricity orbit is a pendulum — swinging close and fast, then far and slow.',
    anchors: [
      { label: 'Earth', value: '0.017', isEarth: true },
      { label: 'Mars', value: '0.093' },
      { label: 'Mercury', value: '0.206' },
      { label: 'Pluto', value: '0.249' },
    ],
  },

  // ── Planetary inputs ────────────────────────────────────────────────────

  planetMass: {
    title: 'Planetary Mass',
    definition:
      'The total mass of the planet relative to Earth (1 M⊕ = Earth mass). Mass determines surface gravity, how much atmosphere a planet can retain, and its internal heat budget.',
    analogy:
      'A heavier planet holds onto its atmosphere more tightly — like a deeper bucket that\'s harder to spill.',
    anchors: [
      { label: 'Mars', value: '0.11 M⊕' },
      { label: 'Earth', value: '1.0 M⊕', isEarth: true },
      { label: 'Neptune', value: '17.1 M⊕' },
      { label: 'Jupiter', value: '317.8 M⊕' },
    ],
  },

  planetRadius: {
    title: 'Planetary Radius',
    definition:
      'The radius of the planet relative to Earth (1 R⊕ = Earth radius). Together with mass, radius determines surface gravity and mean density — which hints at internal composition.',
    analogy:
      'A larger radius spreads the same gravitational pull over a wider surface — the bigger the planet, the lower the surface gravity for the same mass.',
    anchors: [
      { label: 'Mars', value: '0.53 R⊕' },
      { label: 'Earth', value: '1.0 R⊕', isEarth: true },
      { label: 'Neptune', value: '3.9 R⊕' },
      { label: 'Jupiter', value: '11.2 R⊕' },
    ],
  },

  compositionClass: {
    title: 'Composition Class',
    definition:
      'The dominant material making up the planet\'s bulk interior. Silicate planets are rocky like Earth; iron-rich planets have large dense cores; icy planets are rich in water-ice and volatiles; carbon planets replace silicates with carbon compounds.',
    analogy:
      'Like the difference between a sandstone building, a lead safe, an ice sculpture, and a charcoal block — same shape, very different properties.',
    anchors: [
      { label: 'Silicate (Earth-like)', value: '~5.5 g/cm³' },
      { label: 'Iron-rich (Mercury-like)', value: 'dense core, ~5.4 g/cm³' },
      { label: 'Icy (Ganymede-like)', value: '~1.9 g/cm³' },
    ],
  },

  // ── Rotation inputs ─────────────────────────────────────────────────────

  rotationPeriod: {
    title: 'Rotation Period',
    definition:
      'How long it takes the planet to complete one full rotation on its axis, in hours. This sets the length of a day. Very slow rotation increases the temperature contrast between the sunlit and dark hemispheres.',
    analogy:
      'A slowly spinning planet is like a rotisserie chicken that barely turns — one side cooks while the other stays cold.',
    anchors: [
      { label: 'Jupiter', value: '9.9 h' },
      { label: 'Earth', value: '24 h', isEarth: true },
      { label: 'Mars', value: '24.6 h' },
      { label: 'Venus', value: '5,832 h (retrograde)' },
    ],
  },

  axialTilt: {
    title: 'Axial Tilt',
    definition:
      'The angle between the planet\'s rotation axis and the perpendicular to its orbital plane, in degrees. Axial tilt drives the seasons: 0° means no seasons; high tilt means extreme hemispheric cycles.',
    analogy:
      'Earth\'s 23.4° tilt is why you need a winter coat — one hemisphere leans toward the Sun for half the year, then away for the other half.',
    anchors: [
      { label: 'Mercury', value: '0.03° — no seasons' },
      { label: 'Earth', value: '23.4°', isEarth: true },
      { label: 'Mars', value: '25.2°' },
      { label: 'Uranus', value: '97.8° — extreme seasons' },
    ],
  },

  // ── Atmospheric gas inputs ───────────────────────────────────────────────

  pressureN2: {
    title: 'Nitrogen (N₂) Pressure',
    definition:
      'The partial pressure contributed by molecular nitrogen. N₂ is chemically inert and forms the bulk of Earth\'s atmosphere. It has no direct greenhouse effect but raises total pressure, influencing the boiling point of water and biological respiration thresholds.',
    analogy:
      'Nitrogen is the atmosphere\'s filler — it provides bulk and pressure without reacting with much of anything.',
    anchors: [
      { label: 'Mars', value: '0.019 kPa' },
      { label: 'Earth', value: '78.1 kPa', isEarth: true },
      { label: 'Titan', value: '146.7 kPa' },
    ],
  },

  pressureO2: {
    title: 'Oxygen (O₂) Pressure',
    definition:
      'The partial pressure of molecular oxygen. O₂ is required for aerobic respiration. Below ~16 kPa humans cannot survive without supplemental oxygen; above ~50 kPa it becomes a fire hazard and toxic to lung tissue.',
    analogy:
      'Oxygen is the engine fuel — just enough and it runs cleanly, too little and it stalls, too much and it becomes dangerous.',
    anchors: [
      { label: 'Breathable minimum', value: '~16 kPa' },
      { label: 'Earth', value: '21.2 kPa', isEarth: true },
      { label: 'Toxic threshold', value: '> 50 kPa' },
    ],
  },

  pressureCO2: {
    title: 'Carbon Dioxide (CO₂) Pressure',
    definition:
      'The partial pressure of CO₂. Even small amounts produce a strong greenhouse effect, warming the surface. Very high concentrations are toxic. Venus\'s thick CO₂ atmosphere has driven its surface temperature above 460 °C.',
    analogy:
      'CO₂ is a greenhouse gas — like a blanket over the planet that thickens with every molecule you add.',
    anchors: [
      { label: 'Earth', value: '0.04 kPa', isEarth: true },
      { label: 'Mars', value: '0.64 kPa' },
      { label: 'Venus', value: '9,200 kPa' },
    ],
  },

  pressureH2O: {
    title: 'Water Vapour (H₂O) Pressure',
    definition:
      'The partial pressure of water vapour. Water vapour is a powerful greenhouse gas and the key ingredient for clouds, rain, and liquid surface water. Its amount depends on surface temperature and the availability of liquid water.',
    analogy:
      'Water vapour is the atmosphere\'s humidity — raise the temperature and more evaporates upward; raise it enough and you get a runaway greenhouse.',
    anchors: [
      { label: 'Earth (typical)', value: '~1–3 kPa', isEarth: true },
      { label: 'Saturation at 100 °C', value: '101.3 kPa' },
    ],
  },

  pressureCH4: {
    title: 'Methane (CH₄) Pressure',
    definition:
      'The partial pressure of methane. CH₄ is a potent greenhouse gas — roughly 80× more warming than CO₂ over 20 years. On Earth it is produced primarily by biology and anaerobic decay. Significant concentrations can be a biosignature.',
    analogy:
      'Methane is a short-lived but powerful greenhouse gas — like a concentrated fire-starter that burns hot but quickly.',
    anchors: [
      { label: 'Earth', value: '~0.00019 kPa', isEarth: true },
      { label: 'Titan', value: '~5.3 kPa' },
    ],
  },

  pressureAr: {
    title: 'Argon (Ar) Pressure',
    definition:
      'The partial pressure of argon. Ar is a noble gas — completely inert, neither a greenhouse gas nor biologically active. It accumulates in planetary atmospheres over time from the radioactive decay of potassium-40.',
    analogy:
      'Argon is a true bystander — it witnesses everything but does absolutely nothing.',
    anchors: [
      { label: 'Mars', value: '~0.016 kPa' },
      { label: 'Earth', value: '0.96 kPa', isEarth: true },
    ],
  },

  pressureHe: {
    title: 'Helium (He) Pressure',
    definition:
      'The partial pressure of helium. He is light enough to escape from rocky planets over geological time via thermal (Jeans) escape. Its presence indicates ongoing outgassing or capture. Chemically inert with no greenhouse effect.',
    analogy:
      'Helium is the balloon gas of atmospheres — on a rocky planet it slowly leaks away to space over millions of years.',
    anchors: [
      { label: 'Earth', value: '~0.0005 kPa', isEarth: true },
      { label: 'Gas giants', value: 'second most abundant' },
    ],
  },

  pressureH2: {
    title: 'Hydrogen (H₂) Pressure',
    definition:
      'The partial pressure of molecular hydrogen. H₂ is the lightest gas and escapes rocky planets rapidly unless gravity is strong enough to retain it. Thick H₂ envelopes create a potent greenhouse effect and are characteristic of sub-Neptune planets.',
    analogy:
      'Hydrogen is so light it escapes easily — only a very massive planet has the gravitational grip to hold it in large quantities.',
    anchors: [
      { label: 'Earth', value: '~0.00005 kPa (trace)', isEarth: true },
      { label: 'Jupiter', value: 'dominant component' },
    ],
  },

  // ── Output readouts (definition only) ───────────────────────────────────

  gravity: {
    title: 'Surface Gravity',
    definition:
      'The gravitational acceleration at the planet\'s surface, computed from its mass and radius. Determines how much weight an object feels, how easily the atmosphere escapes to space, and the energy cost of geological and biological processes.',
  },

  surfaceTemperature: {
    title: 'Surface Temperature',
    definition:
      'The equilibrium temperature at the planet\'s surface, accounting for stellar energy input, albedo, and the greenhouse effect from the atmospheric composition. Does not model day–night variation or latitudinal gradients.',
  },

  habitability: {
    title: 'Habitability Score',
    definition:
      'A composite score from 0–100 estimating how survivable this world is for an unprotected human, based on surface gravity, atmospheric pressure, temperature, and oxygen availability. This is a survivability index, not a measure of whether life of any kind could exist.',
  },

  atmosphericPressure: {
    title: 'Atmospheric Pressure',
    definition:
      'The total pressure exerted by the atmosphere at the planet\'s surface, equal to the sum of all gas partial pressures. Determines whether liquids can exist at the surface, how dense the air is for flight and respiration, and the rate of atmospheric escape.',
  },

  atmosphere: {
    title: 'Atmospheric Composition',
    definition:
      'The breakdown of the atmosphere by partial pressure of each gas. Each bar segment represents the fractional contribution of one gas to the total surface pressure. The composition drives the greenhouse effect, surface chemistry, and habitability.',
  },

  escapeVelocity: {
    title: 'Escape Velocity',
    definition:
      'The minimum speed an object must reach to escape the planet\'s gravitational pull entirely. Lighter gas molecules move faster at a given temperature — if their average speed approaches the escape velocity, the planet gradually loses that gas to space over geological time.',
  },

  dayLength: {
    title: 'Day Length',
    definition:
      'The time it takes the planet to complete one rotation on its axis. Very long days increase temperature extremes between sunlit and dark sides. Planets tidally locked to their star have a permanent day side and a permanent night side.',
  },

  yearLength: {
    title: 'Year Length',
    definition:
      'The time for the planet to complete one full orbit around its star, derived from Kepler\'s third law. Year length determines the duration of seasonal cycles and the planet\'s time-averaged energy budget.',
  },
};
```

- [ ] **Step 2: Typecheck — verify all 26 keys are present and correctly typed**

Run: `npm run typecheck`
Expected: no errors (TypeScript enforces `Record<ParameterTooltipKey, ParameterTooltip>` completeness)

- [ ] **Step 3: Commit**

```bash
git add src/ui/tooltips/parameterTooltips.ts
git commit -m "feat(ui): add static tooltip content for all 26 parameters"
```

---

## Task 3: Tooltip Component

**Files:**
- Create: `src/ui/Tooltip.test.tsx`
- Create: `src/ui/Tooltip.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/ui/Tooltip.test.tsx
/**
 * @module ui/Tooltip.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { ParameterTooltip } from './tooltips/types';
import { Tooltip } from './Tooltip';

afterEach(cleanup);

const FULL_TOOLTIP: ParameterTooltip = {
  title: 'Semi-Major Axis',
  definition: 'The average distance between a planet and its star.',
  analogy: 'How far from the campfire you sit.',
  anchors: [
    { label: 'Earth', value: '1.00 AU', isEarth: true },
    { label: 'Mars', value: '1.52 AU' },
  ],
};

const MINIMAL_TOOLTIP: ParameterTooltip = {
  title: 'Surface Gravity',
  definition: 'Gravitational acceleration at the surface.',
};

describe('Tooltip', () => {
  it('renders the trigger button', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    expect(screen.getByRole('button', { name: 'More information' })).toBeTruthy();
  });

  it('does not show the card at rest', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the card on mouse enter', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('hides the card on mouse leave', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    const btn = screen.getByRole('button', { name: 'More information' });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the card on focus', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.focus(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('hides the card on blur', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    const btn = screen.getByRole('button', { name: 'More information' });
    fireEvent.focus(btn);
    fireEvent.blur(btn);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes the card on Escape', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders title and definition', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText('Semi-Major Axis')).toBeTruthy();
    expect(screen.getByText('The average distance between a planet and its star.')).toBeTruthy();
  });

  it('renders the analogy when provided', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText('How far from the campfire you sit.')).toBeTruthy();
  });

  it('omits the analogy when not provided', () => {
    render(<Tooltip tooltip={MINIMAL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.queryByText(/campfire/)).toBeNull();
  });

  it('renders anchor labels and values when provided', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText(/Earth/)).toBeTruthy();
    expect(screen.getByText(/1\.00 AU/)).toBeTruthy();
    expect(screen.getByText(/Mars/)).toBeTruthy();
    expect(screen.getByText(/1\.52 AU/)).toBeTruthy();
  });

  it('marks the Earth anchor with a checkmark', () => {
    render(<Tooltip tooltip={FULL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('omits anchors when not provided', () => {
    render(<Tooltip tooltip={MINIMAL_TOOLTIP} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'More information' }));
    expect(screen.queryByText('Known values')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/ui/Tooltip.test.tsx`
Expected: FAIL — "Cannot find module './Tooltip'"

- [ ] **Step 3: Implement the Tooltip component**

```typescript
// src/ui/Tooltip.tsx
/**
 * @module ui/Tooltip
 *
 * Floating tooltip card triggered by a hover/focus ⓘ button.
 * The ⓘ is hidden at rest via CSS; the parent row's :hover selector
 * reveals it (.tactical-field:hover .tooltip-trigger, etc.).
 * Opening the card requires hovering or focusing the ⓘ itself.
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { JSX } from 'react';

import type { ParameterTooltip } from './tooltips/types';

export function Tooltip({ tooltip }: { tooltip: ParameterTooltip }): JSX.Element {
  const [open, setOpen] = useState(false);
  const id = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open || cardRef.current === null) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      cardRef.current.style.left = 'auto';
      cardRef.current.style.right = '0';
    }
  }, [open]);

  return (
    <span className="tooltip-wrap">
      <button
        type="button"
        className="tooltip-trigger"
        aria-label="More information"
        aria-describedby={id}
        onMouseEnter={() => { setOpen(true); }}
        onMouseLeave={() => { setOpen(false); }}
        onFocus={() => { setOpen(true); }}
        onBlur={() => { setOpen(false); }}
      >
        <span aria-hidden="true">ⓘ</span>
      </button>
      {open && (
        <div role="tooltip" id={id} className="tooltip-card" ref={cardRef}>
          <p className="tooltip-title">{tooltip.title}</p>
          <p className="tooltip-def">{tooltip.definition}</p>
          {tooltip.analogy !== undefined && (
            <p className="tooltip-analogy">{tooltip.analogy}</p>
          )}
          {tooltip.anchors !== undefined && tooltip.anchors.length > 0 && (
            <div className="tooltip-anchors">
              <span className="tooltip-anchors-label">Known values</span>
              {tooltip.anchors.map((anchor) => (
                <div key={anchor.label} className="tooltip-anchor-row">
                  <span className="tooltip-anchor-name">{anchor.label}</span>
                  {' · '}
                  <span className="tooltip-anchor-value">{anchor.value}</span>
                  {anchor.isEarth === true && (
                    <span className="tooltip-earth-mark"> ✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Add tooltip CSS to `src/index.css`**

Append the following block at the end of `src/index.css` (after the last existing rule):

```css
/* ── Parameter tooltips ────────────────────────────────────────────────── */

.tooltip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.tooltip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--border-active);
  background: transparent;
  color: var(--cyan-bright);
  font-size: 0.52rem;
  font-family: var(--font-ui);
  line-height: 1;
  cursor: help;
  padding: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

/* Reveal when parent row is hovered or button itself is focused */
.tactical-field:hover .tooltip-trigger,
.select-field:hover .tooltip-trigger,
.readout-label-group:hover .tooltip-trigger,
.tooltip-trigger:focus {
  opacity: 1;
  pointer-events: auto;
}

.tooltip-card {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  width: 260px;
  background: var(--void-raised);
  border: 1px solid var(--border-active);
  border-radius: 5px;
  padding: 12px 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 12px var(--cyan-glow);
}

.tooltip-card::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 14px;
  width: 8px;
  height: 8px;
  background: var(--void-raised);
  border-left: 1px solid var(--border-active);
  border-top: 1px solid var(--border-active);
  transform: rotate(45deg);
}

.tooltip-title {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: var(--text-caption);
  font-weight: 600;
  letter-spacing: var(--tracking-tactical);
  text-transform: uppercase;
  color: var(--cyan-bright);
}

.tooltip-def {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--text-body);
  color: var(--text-primary);
  line-height: 1.55;
}

.tooltip-analogy {
  margin: 8px 0 0;
  font-family: var(--font-ui);
  font-size: var(--text-body);
  font-style: italic;
  color: var(--amber-bright);
  line-height: 1.45;
  border-top: 1px solid rgba(232, 168, 53, 0.15);
  padding-top: 7px;
}

.tooltip-anchors {
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px solid var(--border-dim);
}

.tooltip-anchors-label {
  display: block;
  font-family: var(--font-display);
  font-size: var(--text-micro);
  letter-spacing: var(--tracking-tactical);
  text-transform: uppercase;
  color: var(--text-ghost);
  margin-bottom: 4px;
}

.tooltip-anchor-row {
  font-family: var(--font-data);
  font-size: var(--text-caption);
  color: var(--cyan-mid);
  line-height: 1.8;
}

.tooltip-anchor-name {
  color: var(--text-secondary);
}

.tooltip-anchor-value {
  color: var(--cyan-mid);
}

.tooltip-earth-mark {
  color: var(--status-nominal);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/ui/Tooltip.test.tsx`
Expected: 13 tests pass

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/ui/Tooltip.tsx src/ui/Tooltip.test.tsx src/index.css
git commit -m "feat(ui): add Tooltip component with hover/focus trigger"
```

---

## Task 4: NumberField Tooltip Prop

**Files:**
- Modify: `src/ui/NumberField.tsx`
- Modify: `src/ui/NumberField.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to the end of the `describe('NumberField')` block in `src/ui/NumberField.test.tsx`:

```typescript
// Add at the top of the file, after the existing imports:
import type { ParameterTooltip } from './tooltips/types';

// Add at the top of describe('NumberField'):
const MOCK_TOOLTIP: ParameterTooltip = {
  title: 'Test',
  definition: 'A test definition.',
};

// Add these two tests at the end of describe('NumberField'):
it('renders a tooltip trigger when the tooltip prop is provided', () => {
  render(
    <NumberField label="Mass" value={1} onCommit={vi.fn()} tooltip={MOCK_TOOLTIP} />,
  );
  expect(screen.getByRole('button', { name: 'More information' })).toBeTruthy();
});

it('does not render a tooltip trigger when the tooltip prop is omitted', () => {
  render(<NumberField label="Mass" value={1} onCommit={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'More information' })).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run src/ui/NumberField.test.tsx`
Expected: the 2 new tests FAIL — "tooltip" is not a valid prop yet

- [ ] **Step 3: Update NumberField to accept and render the tooltip**

Replace `src/ui/NumberField.tsx` with:

```typescript
/**
 * @module ui/NumberField
 *
 * A step-flanked tactical numeric field. The − / + buttons nudge the
 * committed value by one step (clamped to min/max) and commit immediately;
 * the central input commits on blur or Enter — so one deliberate edit
 * produces one recompute and one history entry. Invalid or unchanged entries
 * revert to the committed value.
 *
 * The input is named via `aria-label` (not a wrapping label) so the step
 * buttons' glyphs do not pollute its accessible name.
 */

import { useEffect, useState } from 'react';
import type { JSX } from 'react';

import type { ParameterTooltip } from './tooltips/types';
import { Tooltip } from './Tooltip';

/** Decimal places implied by a step, so nudging avoids float noise. */
function decimalsOf(step: number): number {
  const fraction = String(step).split('.')[1];
  return fraction === undefined ? 0 : fraction.length;
}

export function NumberField({
  label,
  value,
  unit,
  min,
  max,
  step,
  tooltip,
  onCommit,
}: {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: ParameterTooltip;
  onCommit: (value: number) => void;
}): JSX.Element {
  const [draft, setDraft] = useState(String(value));
  const fullLabel = unit === undefined ? label : `${label} (${unit})`;

  // Re-sync the draft whenever the committed value changes (e.g. undo/redo).
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (): void => {
    const parsed = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(parsed) && parsed !== value) {
      onCommit(parsed);
    } else {
      setDraft(String(value));
    }
  };

  const nudge = (direction: 1 | -1): void => {
    const delta = step ?? 1;
    let next = value + direction * delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    next = Number(next.toFixed(decimalsOf(delta)));
    if (next !== value) {
      onCommit(next);
    }
  };

  return (
    <div className="tactical-field">
      <span className="field-label">
        {fullLabel}
        {tooltip !== undefined && <Tooltip tooltip={tooltip} />}
      </span>
      <div className="field-input-group">
        <button
          type="button"
          className="step-btn"
          aria-label={`Decrease ${label}`}
          onClick={() => {
            nudge(-1);
          }}
        >
          −
        </button>
        <input
          type="number"
          className="tactical-input"
          aria-label={fullLabel}
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commit();
            }
          }}
        />
        <button
          type="button"
          className="step-btn"
          aria-label={`Increase ${label}`}
          onClick={() => {
            nudge(1);
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/NumberField.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/ui/NumberField.tsx src/ui/NumberField.test.tsx
git commit -m "feat(ui): add optional tooltip prop to NumberField"
```

---

## Task 5: ReadoutCard Tooltip Prop

**Files:**
- Modify: `src/ui/ReadoutCard.tsx`
- Modify: `src/ui/ReadoutCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/ui/ReadoutCard.test.tsx` — append these after the existing tests:

```typescript
// Add at the top with imports:
import type { ParameterTooltip } from './tooltips/types';

// Add inside describe('ReadoutCard'):
const MOCK_TOOLTIP: ParameterTooltip = {
  title: 'Surface Gravity',
  definition: 'Gravitational acceleration at the surface.',
};

it('renders a tooltip trigger when the tooltip prop is provided', () => {
  render(<ReadoutCard label="Gravity" rawValue="9.8 m/s²" tooltip={MOCK_TOOLTIP} />);
  expect(screen.getByRole('button', { name: 'More information' })).toBeTruthy();
});

it('does not render a tooltip trigger when tooltip is not provided', () => {
  render(<ReadoutCard label="Gravity" rawValue="9.8 m/s²" />);
  expect(screen.queryByRole('button', { name: 'More information' })).toBeNull();
});

it('existing heading name is unaffected when tooltip is present', () => {
  render(
    <ReadoutCard
      label="Surface Temperature"
      translation={{
        brief: 'Temperate',
        narrative: 'Comfortable by Earth standards.',
        earthComparison: "Earth's average is about 15 °C.",
      }}
      rawValue="288 K | 15 °C"
      tooltip={MOCK_TOOLTIP}
    />,
  );
  expect(screen.getByRole('heading', { name: 'Surface Temperature' })).toBeTruthy();
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run src/ui/ReadoutCard.test.tsx`
Expected: 3 new tests FAIL

- [ ] **Step 3: Update ReadoutCard**

Replace `src/ui/ReadoutCard.tsx` with:

```typescript
/**
 * @module ui/ReadoutCard
 *
 * Presents one computed property as a felt experience (CLAUDE.md §15): the
 * brief label, the narrative sentence, an Earth comparison, and — always —
 * the raw physical value beneath, so the translation supplements the number
 * rather than hiding it.
 *
 * Two modes: a full translation card (the physics readouts), or an
 * instrument card carrying just a `brief` line plus a visual (habitability,
 * atmosphere). An optional `tone` colors the card's status rule.
 *
 * An optional `tooltip` prop renders a ⓘ trigger beside the label. The
 * button sits outside the <h3> so the heading's accessible name is
 * unaffected.
 */

import type { JSX, ReactNode } from 'react';

import type { HumanTranslation } from '../translation';
import { Tooltip } from './Tooltip';
import type { ParameterTooltip } from './tooltips/types';

export type ReadoutTone = 'nominal' | 'caution' | 'critical' | 'accent';

export function ReadoutCard({
  label,
  translation,
  brief,
  tone,
  rawValue,
  instrument,
  tooltip,
}: {
  label: string;
  translation?: HumanTranslation;
  brief?: string;
  tone?: ReadoutTone;
  rawValue: string;
  instrument?: ReactNode;
  tooltip?: ParameterTooltip;
}): JSX.Element {
  const briefText = translation?.brief ?? brief;
  const toneClass = tone === undefined ? '' : ` readout-tone-${tone}`;

  return (
    <article className={`readout-card${toneClass}`}>
      <header className="readout-head">
        <span className="readout-label-group">
          <h3 className="readout-label">
            <span aria-hidden="true" className="readout-glyph">
              ◈
            </span>
            {label}
          </h3>
          {tooltip !== undefined && <Tooltip tooltip={tooltip} />}
        </span>
        <p className="readout-raw" aria-label="raw value">
          {rawValue}
        </p>
      </header>
      {briefText !== undefined && <p className="readout-brief">{briefText}</p>}
      {instrument !== undefined && <div className="readout-instrument">{instrument}</div>}
      {translation !== undefined && <p className="readout-narrative">{translation.narrative}</p>}
      {translation?.earthComparison !== undefined && (
        <p className="readout-comparison">{translation.earthComparison}</p>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Add `.readout-label-group` to `src/index.css`**

Add this rule immediately after the `.readout-label` block (around line 604 in index.css):

```css
.readout-label-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/ui/ReadoutCard.test.tsx`
Expected: all tests pass

- [ ] **Step 6: Full suite**

Run: `npm test`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/ui/ReadoutCard.tsx src/ui/ReadoutCard.test.tsx src/index.css
git commit -m "feat(ui): add optional tooltip prop to ReadoutCard"
```

---

## Task 6: Wire Tooltips in InputPanels

**Files:**
- Modify: `src/ui/InputPanels.tsx`
- Modify: `src/ui/InputPanels.test.tsx`

- [ ] **Step 1: Write a failing test**

Add to the end of `describe('InputPanels')` in `src/ui/InputPanels.test.tsx`:

```typescript
it('renders tooltip triggers for input parameters', async () => {
  const stores = await seededStores();
  render(
    <StoresProvider stores={stores}>
      <InputPanels />
    </StoresProvider>,
  );
  // 18 parameters total → 18 tooltip trigger buttons
  const triggers = screen.getAllByRole('button', { name: 'More information' });
  expect(triggers.length).toBe(18);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/ui/InputPanels.test.tsx`
Expected: FAIL — 0 tooltip triggers found

- [ ] **Step 3: Update InputPanels.tsx**

Replace `src/ui/InputPanels.tsx` with:

```typescript
/**
 * @module ui/InputPanels
 *
 * The world-editor panels. Each control reads the current configuration
 * from the simulation store and, on commit, dispatches a new immutable
 * configuration through `commitConfiguration` — typed inputs only, never
 * computed outputs (CLAUDE.md §4, §15). The physics engine produces every
 * resulting value; these panels only supply its inputs.
 */

import type { JSX } from 'react';

import { commitConfiguration } from '../store';
import {
  ATMOSPHERIC_GASES,
  PLANET_COMPOSITION_CLASSES,
  SPECTRAL_CLASSES,
} from '../types/configuration';
import type {
  AtmosphericGas,
  PlanetCompositionClass,
  PlanetConfiguration,
} from '../types/configuration';
import { NumberField } from './NumberField';
import { SpectralClassSelector } from './SpectralClassSelector';
import { TacticalPanel } from './TacticalPanel';
import { Tooltip } from './Tooltip';
import { PARAMETER_TOOLTIPS } from './tooltips/parameterTooltips';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

export function InputPanels(): JSX.Element | null {
  const stores = useStores();
  const state = useStore(stores.simulation);
  const config = state.configuration;

  if (config === null) {
    return null;
  }

  const apply = (next: PlanetConfiguration): void => {
    void commitConfiguration(stores, next);
  };

  return (
    <form className="input-panels" aria-label="world parameters">
      <TacticalPanel index={0} eyebrow="Subsystem 01" title="Stellar Data">
        <label className="select-field">
          <span className="field-label">
            Spectral class
            <Tooltip tooltip={PARAMETER_TOOLTIPS.spectralClass} />
          </span>
          <SpectralClassSelector
            value={config.stellar.spectralClass}
            options={SPECTRAL_CLASSES}
            onChange={(spectralClass) => {
              apply({ ...config, stellar: { ...config.stellar, spectralClass } });
            }}
          />
        </label>
        <NumberField
          label="Mass"
          unit="M☉"
          value={config.stellar.massSolarMasses}
          min={0.075}
          max={150}
          step={0.1}
          tooltip={PARAMETER_TOOLTIPS.stellarMass}
          onCommit={(massSolarMasses) => {
            apply({ ...config, stellar: { ...config.stellar, massSolarMasses } });
          }}
        />
        <NumberField
          label="Age"
          unit="Gyr"
          value={config.stellar.ageGigayears}
          min={0}
          step={0.1}
          tooltip={PARAMETER_TOOLTIPS.stellarAge}
          onCommit={(ageGigayears) => {
            apply({ ...config, stellar: { ...config.stellar, ageGigayears } });
          }}
        />
      </TacticalPanel>

      <TacticalPanel index={1} eyebrow="Subsystem 02" title="Orbital Parameters">
        <NumberField
          label="Semi-major axis"
          unit="AU"
          value={config.orbital.semiMajorAxisAstronomicalUnits}
          min={0}
          step={0.01}
          tooltip={PARAMETER_TOOLTIPS.semiMajorAxis}
          onCommit={(semiMajorAxisAstronomicalUnits) => {
            apply({ ...config, orbital: { ...config.orbital, semiMajorAxisAstronomicalUnits } });
          }}
        />
        <NumberField
          label="Eccentricity"
          value={config.orbital.eccentricity}
          min={0}
          max={0.99}
          step={0.01}
          tooltip={PARAMETER_TOOLTIPS.eccentricity}
          onCommit={(eccentricity) => {
            apply({ ...config, orbital: { ...config.orbital, eccentricity } });
          }}
        />
      </TacticalPanel>

      <TacticalPanel index={2} eyebrow="Subsystem 03" title="Planetary Body">
        <NumberField
          label="Mass"
          unit="M⊕"
          value={config.planetary.massEarthMasses}
          min={0}
          step={0.1}
          tooltip={PARAMETER_TOOLTIPS.planetMass}
          onCommit={(massEarthMasses) => {
            apply({ ...config, planetary: { ...config.planetary, massEarthMasses } });
          }}
        />
        <NumberField
          label="Radius"
          unit="R⊕"
          value={config.planetary.radiusEarthRadii}
          min={0}
          step={0.1}
          tooltip={PARAMETER_TOOLTIPS.planetRadius}
          onCommit={(radiusEarthRadii) => {
            apply({ ...config, planetary: { ...config.planetary, radiusEarthRadii } });
          }}
        />
        <label className="select-field">
          <span className="field-label">
            Composition
            <Tooltip tooltip={PARAMETER_TOOLTIPS.compositionClass} />
          </span>
          <select
            value={config.planetary.compositionClass}
            onChange={(event) => {
              apply({
                ...config,
                planetary: {
                  ...config.planetary,
                  compositionClass: event.target.value as PlanetCompositionClass,
                },
              });
            }}
          >
            {PLANET_COMPOSITION_CLASSES.map((compositionClass) => (
              <option key={compositionClass} value={compositionClass}>
                {compositionClass}
              </option>
            ))}
          </select>
        </label>
      </TacticalPanel>

      <TacticalPanel index={3} eyebrow="Subsystem 04" title="Rotation">
        <NumberField
          label="Rotation period"
          unit="h"
          value={config.rotation.rotationPeriodHours}
          step={1}
          tooltip={PARAMETER_TOOLTIPS.rotationPeriod}
          onCommit={(rotationPeriodHours) => {
            apply({ ...config, rotation: { ...config.rotation, rotationPeriodHours } });
          }}
        />
        <NumberField
          label="Axial tilt"
          unit="°"
          value={config.rotation.axialTiltDegrees}
          min={0}
          max={180}
          step={1}
          tooltip={PARAMETER_TOOLTIPS.axialTilt}
          onCommit={(axialTiltDegrees) => {
            apply({ ...config, rotation: { ...config.rotation, axialTiltDegrees } });
          }}
        />
      </TacticalPanel>

      <TacticalPanel index={4} eyebrow="Subsystem 05" title="Atmospheric Composition">
        <p className="panel-note">Partial pressures · kPa</p>
        {ATMOSPHERIC_GASES.map((gas: AtmosphericGas) => {
          const gasTooltipKey = {
            N2: 'pressureN2',
            O2: 'pressureO2',
            CO2: 'pressureCO2',
            H2O: 'pressureH2O',
            CH4: 'pressureCH4',
            Ar: 'pressureAr',
            He: 'pressureHe',
            H2: 'pressureH2',
          } as const;
          return (
            <NumberField
              key={gas}
              label={gas}
              unit="kPa"
              value={config.atmosphere.partialPressuresKilopascals[gas] ?? 0}
              min={0}
              step={0.5}
              tooltip={PARAMETER_TOOLTIPS[gasTooltipKey[gas]]}
              onCommit={(pressure) => {
                apply({
                  ...config,
                  atmosphere: {
                    partialPressuresKilopascals: {
                      ...config.atmosphere.partialPressuresKilopascals,
                      [gas]: pressure,
                    },
                  },
                });
              }}
            />
          );
        })}
      </TacticalPanel>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/InputPanels.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Full suite**

Run: `npm test`
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/ui/InputPanels.tsx src/ui/InputPanels.test.tsx
git commit -m "feat(ui): wire parameter tooltips in InputPanels"
```

---

## Task 7: Wire Tooltips in WorldReadouts

**Files:**
- Modify: `src/ui/WorldReadouts.tsx`
- Modify: `src/ui/WorldReadouts.test.tsx`

- [ ] **Step 1: Write a failing test**

Add to the end of `describe('WorldReadouts')` in `src/ui/WorldReadouts.test.tsx`:

```typescript
it('renders tooltip triggers for all output readout cards', async () => {
  const stores = createAppStores();
  await commitConfiguration(stores, createDefaultConfiguration());
  render(
    <StoresProvider stores={stores}>
      <WorldReadouts />
    </StoresProvider>,
  );
  // 8 readout cards, each with a tooltip trigger button
  const triggers = screen.getAllByRole('button', { name: 'More information' });
  expect(triggers.length).toBe(8);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/ui/WorldReadouts.test.tsx`
Expected: FAIL — 0 tooltip triggers found

- [ ] **Step 3: Update WorldReadouts.tsx**

Replace `src/ui/WorldReadouts.tsx` with:

```typescript
/**
 * @module ui/WorldReadouts
 *
 * Reads the computed `PlanetaryState` from the simulation store and renders
 * a felt-experience card per property via the translation layer. Pure
 * display: it performs no physics, only formatting of values the engine
 * produced.
 */

import type { JSX } from 'react';

import {
  translateDayLength,
  translateEscapeVelocity,
  translateGravity,
  translateOrbitalPeriod,
  translatePressure,
  translateSurfaceTemperature,
} from '../translation';
import type { HabitabilityStatus } from '../types/habitability';
import { AtmosphereBar } from './AtmosphereBar';
import { GravityGauge } from './GravityGauge';
import { HabitabilityGauge, survivabilityTone } from './HabitabilityGauge';
import { ReadoutCard } from './ReadoutCard';
import { ThermalSpectrum } from './ThermalSpectrum';
import { PARAMETER_TOOLTIPS } from './tooltips/parameterTooltips';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const KELVIN_TO_CELSIUS_OFFSET = 273.15;

/** Felt-experience brief for a human-baseline survivability status. */
const SURVIVAL_BRIEF: Record<HabitabilityStatus, string> = {
  optimal: 'Readily survivable for an unprotected human.',
  tolerable: 'Survivable, but only with life support.',
  hostile: 'Hostile to human life without heavy protection.',
  lethal: 'Immediately lethal to an unprotected human.',
};

export function WorldReadouts(): JSX.Element {
  const { simulation } = useStores();
  const state = useStore(simulation);
  const world = state.planetaryState;

  if (world === null) {
    return (
      <section className="readouts" aria-label="world readouts">
        <p>Configure a world to see its computed properties.</p>
      </section>
    );
  }

  const rotationHours = world.configuration.rotation.rotationPeriodHours;
  const surfaceCelsius = Math.round(world.climate.surfaceTemperatureKelvin - KELVIN_TO_CELSIUS_OFFSET);
  const survival = state.habitability?.survival[0] ?? null;

  return (
    <section className="readouts" aria-label="world readouts">
      <ReadoutCard
        label="Gravity"
        translation={translateGravity(world.bulk.surfaceGravityMetersPerSecondSquared)}
        rawValue={`${world.bulk.surfaceGravityMetersPerSecondSquared.toFixed(2)} m/s²`}
        tooltip={PARAMETER_TOOLTIPS.gravity}
        instrument={
          <GravityGauge
            surfaceGravityMetersPerSecondSquared={world.bulk.surfaceGravityMetersPerSecondSquared}
          />
        }
      />
      <ReadoutCard
        label="Surface Temperature"
        translation={translateSurfaceTemperature(world.climate.surfaceTemperatureKelvin)}
        rawValue={`${Math.round(world.climate.surfaceTemperatureKelvin)} K | ${surfaceCelsius} °C`}
        tooltip={PARAMETER_TOOLTIPS.surfaceTemperature}
        instrument={<ThermalSpectrum temperatureKelvin={world.climate.surfaceTemperatureKelvin} />}
      />
      {survival !== null && (
        <ReadoutCard
          label="Habitability"
          brief={SURVIVAL_BRIEF[survival.status]}
          tone={survivabilityTone(survival.survivabilityScore)}
          rawValue={`${Math.round(survival.survivabilityScore)} / 100`}
          tooltip={PARAMETER_TOOLTIPS.habitability}
          instrument={
            <HabitabilityGauge
              score={survival.survivabilityScore}
              limitingFactor={survival.limitingFactor}
            />
          }
        />
      )}
      <ReadoutCard
        label="Atmospheric Pressure"
        translation={translatePressure(world.atmosphere.surfacePressureKilopascals)}
        rawValue={`${world.atmosphere.surfacePressureKilopascals.toFixed(1)} kPa`}
        tooltip={PARAMETER_TOOLTIPS.atmosphericPressure}
      />
      <ReadoutCard
        label="Atmosphere"
        brief="Composition by partial pressure."
        tone="accent"
        rawValue={`${world.atmosphere.surfacePressureKilopascals.toFixed(1)} kPa`}
        tooltip={PARAMETER_TOOLTIPS.atmosphere}
        instrument={
          <AtmosphereBar
            partialPressuresKilopascals={world.configuration.atmosphere.partialPressuresKilopascals}
          />
        }
      />
      <ReadoutCard
        label="Escape Velocity"
        translation={translateEscapeVelocity(world.bulk.escapeVelocityMetersPerSecond)}
        rawValue={`${(world.bulk.escapeVelocityMetersPerSecond / 1000).toFixed(1)} km/s`}
        tooltip={PARAMETER_TOOLTIPS.escapeVelocity}
      />
      <ReadoutCard
        label="Day Length"
        translation={translateDayLength(rotationHours * SECONDS_PER_HOUR)}
        rawValue={`${rotationHours.toFixed(1)} h`}
        tooltip={PARAMETER_TOOLTIPS.dayLength}
      />
      <ReadoutCard
        label="Year Length"
        translation={translateOrbitalPeriod(world.orbit.orbitalPeriodSeconds)}
        rawValue={`${(world.orbit.orbitalPeriodSeconds / SECONDS_PER_DAY).toFixed(0)} days`}
        tooltip={PARAMETER_TOOLTIPS.yearLength}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/WorldReadouts.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Full suite and typecheck**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass, zero warnings

- [ ] **Step 6: Commit**

```bash
git add src/ui/WorldReadouts.tsx src/ui/WorldReadouts.test.tsx
git commit -m "feat(ui): wire parameter tooltips in WorldReadouts"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✓ Floating tooltip visual style — `Tooltip.tsx` + CSS
- ✓ Trigger: ⓘ fades in on row hover, opens tooltip on ⓘ hover — CSS `.tactical-field:hover .tooltip-trigger` + `onMouseEnter`
- ✓ All 18 input parameters — `InputPanels.tsx` Task 6
- ✓ All 8 output readouts — `WorldReadouts.tsx` Task 7
- ✓ Input tooltips: definition + analogy + anchors — `parameterTooltips.ts`
- ✓ Output tooltips: definition only — `parameterTooltips.ts` (no `analogy`/`anchors` on output keys)
- ✓ Static content, no AI — pure data file
- ✓ Accessibility: role="tooltip", aria-describedby, Escape closes, focus reveals — `Tooltip.tsx`
- ✓ `.readout-label-group` keeps heading accessible name clean — `ReadoutCard.tsx` restructure

**Type consistency:**
- `ParameterTooltip` defined in Task 1 → imported in Tasks 3, 4, 5
- `ParameterTooltipKey` used as key type in Task 2 → TypeScript enforces all 26 keys present
- `PARAMETER_TOOLTIPS` exported from Task 2 → imported in Tasks 6, 7
- `Tooltip` component exported from Task 3 → imported in Tasks 4, 5, 6
