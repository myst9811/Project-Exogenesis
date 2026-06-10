
# Project Exogenesis — CLAUDE.md

> **This document is the single source of truth for all development decisions, architectural choices, scientific standards, and engineering behavior on Project Exogenesis.**
>
> Every section is mandatory reading before writing a single line of code.
> Every rule is non-negotiable unless explicitly overridden in writing by the project owner.

---

## Table of Contents

1. [Mission & Vision](#1-mission--vision)
2. [Development Philosophy](#2-development-philosophy)
3. [System Architecture](#3-system-architecture)
4. [Module Boundaries & Ownership](#4-module-boundaries--ownership)
5. [Physics Engine Standards](#5-physics-engine-standards)
6. [Scientific Accuracy Standards](#6-scientific-accuracy-standards)
7. [AI Integration Rules](#7-ai-integration-rules)
8. [Rendering Pipeline Standards](#8-rendering-pipeline-standards)
9. [Engineering Standards](#9-engineering-standards)
10. [TypeScript Standards](#10-typescript-standards)
11. [Testing Standards](#11-testing-standards)
12. [Documentation Standards](#12-documentation-standards)
13. [Git & Commit Policy](#13-git--commit-policy)
14. [Commit Messages](#14-commit-messages)
15. [UX Philosophy & Translation Layer](#15-ux-philosophy--translation-layer)
16. [Long-Term Vision & Roadmap](#16-long-term-vision--roadmap)
17. [Dependency Policy](#17-dependency-policy)
18. [Performance Budgets](#18-performance-budgets)
19. [Error Handling Standards](#19-error-handling-standards)
20. [Naming Conventions](#20-naming-conventions)

---

## 1. Mission & Vision

### What This Project Is

Project Exogenesis is a **scientifically grounded exoplanet creation and exploration platform**.

It is not a game.
It is not a fantasy world generator.
It is not a toy or a toy simulator.

It is the most compelling **interactive planetary science experience** available on the web.

Users should feel like **planetary scientists**, **astrophysicists**, and **explorers** discovering entirely new worlds derived from real physical laws.

### What We Are Building Toward

The experience should sit at the intersection of:

| Reference | What We Borrow |
|---|---|
| **NASA / ESA** | Scientific credibility, real data formats, real physical models |
| **Universe Sandbox** | Cause-and-effect physics simulation, interactive parameter control |
| **Kerbal Space Program** | Learning physics through play, accessible complexity |
| **No Man's Sky** | Sense of discovery, procedural variation, aesthetic wonder |
| **Scientific Visualization** | Data-to-visual pipelines, legible, honest representation |

Every design decision must be defensible against all five references simultaneously.

### What We Are Not Building

- A fantasy map generator
- A "planet randomizer"
- A game with stats masquerading as science
- A visualization that looks scientific but isn't grounded in physics
- An entertainment product that sacrifices accuracy for convenience

### The Standard of Success

A planetary scientist, astrophysicist, or educated student should be able to use Project Exogenesis and say:

> "This is not exactly how I would model it, but every decision here is physically defensible."

That is the bar. Not "it looks cool." Not "it's fun." **Physically defensible.**

---

## 2. Development Philosophy

### The Hierarchy

```
Physics Engine
      │
      ▼
Visual Systems   ◄── all visual parameters derive from physics outputs
      │
      ▼
AI Explanation Layer   ◄── all explanations derive from physics outputs
```

This hierarchy is **absolute**. No layer may influence the layer above it.

### Physics First

The physics engine is the **source of truth** for all simulation state.

- All planetary properties are computed, not authored
- All environmental characteristics derive from physical parameters
- No slider produces a value — sliders produce inputs; the engine produces outputs

If a value cannot be derived from physics, that value does not exist in the simulation.

### Visuals Second

The visual system is a **read-only consumer** of physics state.

- Atmosphere color derives from atmospheric composition and stellar spectrum
- Surface temperature palette derives from computed surface temperature
- Cloud coverage derives from atmospheric pressure and water vapor fraction
- Sky rendering derives from atmospheric scattering coefficients

No visual parameter is authored directly. Every visual parameter is computed.

### AI Third

The AI layer is a **read-only explainer** of physics state.

- AI may describe what the physics engine computed
- AI may explain the scientific reasoning behind computed values
- AI may speculate about plausible implications (clearly labeled as speculation)
- AI may never produce, override, modify, or influence simulation values

**If AI is generating a number that enters the simulation, that is a bug.**

### Determinism

Given identical inputs, the simulation must produce identical outputs. Always.

- No `Math.random()` in physics calculations
- Seeds must be explicit and documented
- Procedural variation must be deterministic given a seed

---

## 3. System Architecture

### High-Level Module Map

```
src/
├── physics/               # Core simulation engine — owns all computed values
│   ├── stellar/           # Star properties: luminosity, temperature, spectrum, lifecycle
│   ├── orbital/           # Orbital mechanics: semi-major axis, eccentricity, period, resonances
│   ├── planetary/         # Mass, radius, density, internal structure
│   ├── atmosphere/        # Atmospheric composition, retention, greenhouse effect
│   ├── climate/           # Energy budget, temperature distribution, albedo feedback
│   ├── habitability/      # Habitable zone, liquid water window, biosignature proxies
│   └── constants.ts       # Physical constants — all values sourced and cited
│
├── renderer/              # Visual output — reads physics state, never writes it
│   ├── planet/            # Sphere, terrain, surface materials
│   ├── atmosphere/        # Scattering, haze, limb brightening
│   ├── sky/               # Stellar disk, sky color, day/night transitions
│   ├── space/             # Starfield, system view
│   └── pipeline.ts        # Orchestrates render pass order
│
├── ai/                    # Language model integration — reads physics state, never writes it
│   ├── narrator.ts        # Converts physics state to human-readable descriptions
│   ├── educator.ts        # Explains physical mechanisms on demand
│   ├── speculator.ts      # Clearly-labeled extrapolation and implication
│   └── prompts/           # Versioned prompt templates
│
├── translation/           # Physics values → human experiences
│   ├── gravity.ts         # "1.8g" → "Walking feels nearly twice as difficult"
│   ├── time.ts            # "72 hour day" → "A single sunrise every three Earth days"
│   ├── temperature.ts     # "340K" → "Comparable to the hottest deserts on Earth"
│   └── index.ts
│
├── store/                 # Application state management
│   ├── simulation.ts      # Active simulation state
│   ├── ui.ts              # UI-only state (never influences physics)
│   └── history.ts         # Undo/redo stack
│
├── ui/                    # React components — pure display, zero physics logic
│
└── types/                 # Shared TypeScript type definitions
    ├── physics.ts
    ├── render.ts
    └── ai.ts
```

### Data Flow Rules

1. **Physics → Store**: The physics engine writes computed `PlanetaryState` to the store after each recalculation
2. **Store → Renderer**: The renderer subscribes to `PlanetaryState` and derives all visual parameters
3. **Store → AI**: The AI layer receives `PlanetaryState` as context for all generations
4. **Store → Translation**: The translation layer converts `PlanetaryState` into human-readable experience strings
5. **UI → Physics (inputs only)**: The UI may submit parameter changes as typed inputs to the physics engine

**No other data flows are permitted.**

### Immutability Rule

`PlanetaryState` objects must be treated as immutable at all boundaries. The physics engine produces a new `PlanetaryState` on every recalculation. It never mutates in place.

---

## 4. Module Boundaries & Ownership

| Module | May Read | May Write | May Invoke |
|---|---|---|---|
| `physics/` | inputs, constants | `PlanetaryState` | nothing external |
| `renderer/` | `PlanetaryState` | GPU buffers | nothing in `physics/` |
| `ai/` | `PlanetaryState` | AI response strings | nothing in `physics/` or `renderer/` |
| `translation/` | `PlanetaryState` | experience strings | nothing in `physics/` |
| `ui/` | store | user input events | `physics/` inputs only via store actions |

### Strict Prohibitions

- `renderer/` must never import from `physics/` calculation files — only from `physics/` type definitions
- `ai/` must never import anything from `physics/` calculation files
- `ui/` must never perform physics calculations inline
- No module may import from `ui/` except other `ui/` modules

---

## 5. Physics Engine Standards

### Physical Constants

All physical constants must be:

1. Declared in `src/physics/constants.ts`
2. Named with their standard symbol as a suffix (e.g., `GRAVITATIONAL_CONSTANT_G`)
3. Given in SI units unless a clear domain reason exists otherwise
4. Sourced with a citation comment (NIST, IAU, NASA, peer-reviewed paper)

```typescript
// ✅ Correct
/** Gravitational constant. Source: NIST CODATA 2018 */
export const GRAVITATIONAL_CONSTANT_G = 6.674_30e-11; // m³ kg⁻¹ s⁻²

// ❌ Wrong — magic number, no source, no units
const G = 6.67e-11;
```

No magic numbers anywhere in the physics engine. Every numerical value must be either:
- A named constant in `constants.ts`
- A computed result that is documented and testable

### Calculation Documentation

Every physics calculation function must include a JSDoc block with:

1. The physical model being used (name, paper reference if applicable)
2. The equation in standard notation
3. The assumptions made
4. The simplifications applied
5. The domain of validity (e.g., "valid for main sequence stars only")
6. Units for all parameters and the return value

```typescript
/**
 * Computes equilibrium surface temperature using the Energy Balance Model.
 *
 * Equation: T_eq = T_star * sqrt(R_star / (2 * a)) * (1 - A)^(1/4)
 *
 * Assumptions:
 *   - Rapid rotation (uniform temperature distribution)
 *   - No greenhouse effect (bare rock approximation)
 *   - Lambertian reflectance (uniform albedo)
 *
 * Simplifications:
 *   - Ignores tidal heating
 *   - Ignores internal radiogenic heating
 *   - Treats planet as a perfect blackbody emitter
 *
 * Domain: Valid for rocky planets 0.1–10 AU from main sequence stars.
 *
 * @param stellarTemperature - Effective stellar temperature in Kelvin
 * @param stellarRadius - Stellar radius in meters
 * @param orbitalRadius - Semi-major axis in meters
 * @param albedo - Bond albedo (dimensionless, 0–1)
 * @returns Equilibrium temperature in Kelvin
 *
 * @see Williams & Pollard (2002), doi:10.1017/S1473550402001064
 */
export function computeEquilibriumTemperature(
  stellarTemperature: number,
  stellarRadius: number,
  orbitalRadius: number,
  albedo: number,
): number {
  // ...
}
```

### Estimated vs. Calculated Values

Distinguish clearly between values that are **derived from physics equations** vs. values that are **approximated from empirical relations**:

```typescript
// Calculated from first principles
const surfaceGravity = (GRAVITATIONAL_CONSTANT_G * mass) / (radius ** 2);

// Estimated from empirical relation — document the source
// Mass-radius relation for rocky planets: Chen & Kipping (2017)
const estimatedRadius = 1.008 * (mass / EARTH_MASS) ** 0.279 * EARTH_RADIUS;
```

Any empirical estimation must be annotated with `// ESTIMATE:` and a citation.

---

## 6. Scientific Accuracy Standards

### Preferred Models by Domain

| Domain | Preferred Model | Acceptable Simplification |
|---|---|---|
| Stellar luminosity | Main sequence mass-luminosity relation | ✓ |
| Habitable zone | Kopparapu et al. (2013) HZ limits | ✓ |
| Atmospheric retention | Jeans escape parameter | Restricted to pure gases |
| Greenhouse effect | Simplified radiative forcing model | Not: linear interpolation of temperature |
| Surface temperature | Energy balance model + greenhouse delta | ✓ |
| Albedo | Surface composition weighted average | ✓ |
| Tidal locking | Goldreich-Soter criterion | ✓ |
| Orbital mechanics | Keplerian elements | Acceptable to ignore n-body for MVP |

### When Scientific Uncertainty Exists

Apply the following protocol in order:

1. **Use the simplest defensible published model** — prefer peer-reviewed papers to textbook approximations
2. **Document the uncertainty** explicitly in code comments
3. **Choose conservative assumptions** rather than dramatic ones (e.g., for habitability, favor false negatives over false positives)
4. **Mark the output as an estimate** in the data type if the uncertainty is significant

```typescript
interface AtmosphericRetentionResult {
  /** Fraction of atmosphere retained after N Gyr */
  retentionFraction: number;
  /** Whether this is a first-principles calculation or an empirical estimate */
  confidence: 'calculated' | 'estimated' | 'speculative';
  /** Human-readable note on model limitations */
  caveat?: string;
}
```

### Forbidden Practices

- **Never use astrology, numerology, or non-physical mappings** as the basis for any value
- **Never invent physical constants** or adjust known constants for aesthetic reasons
- **Never model an effect without understanding its mechanism** — if you cannot explain why the equation works, do not use it
- **Never claim certainty where there is scientific debate** — reflect the debate honestly in documentation and UI

---

## 7. AI Integration Rules

### What AI May Do

| Permitted | Example |
|---|---|
| Describe computed physics | "Surface gravity is 1.8g, meaning the planet is significantly denser than Earth" |
| Explain physical mechanisms | "High gravity on this world is a consequence of its unusually dense iron core" |
| Contextualize numbers | "At 340K, the surface temperature exceeds the comfortable range for most Earth life" |
| Generate flavor text for UI | Names, discovery narratives, speculative ecology (clearly labeled) |
| Answer user questions about physics | Explanation of the greenhouse effect when a user adjusts CO₂ |
| Speculate on extrapolated implications | "A world with this atmosphere might support chemolithotrophs" (labeled as speculative) |

### What AI Must Never Do

| Forbidden | Why |
|---|---|
| Generate simulation inputs | Physics engine owns all simulation values |
| Produce habitability scores | Computed by physics engine from physical parameters |
| Decide atmosphere composition | User input or physics engine output only |
| Generate planet names that influence parameters | Names are cosmetic only |
| Override, correct, or modify physics outputs | Even if the AI "thinks" the value is wrong |

### AI Prompting Standards

All prompts to the AI layer must:

1. Provide the complete relevant `PlanetaryState` as structured context
2. Explicitly instruct the model not to generate simulation values
3. Clearly specify whether the output is a description, explanation, or speculation
4. Be versioned in `src/ai/prompts/` with a semantic version number

```typescript
// src/ai/prompts/planet-description.v1.ts
export const PLANET_DESCRIPTION_PROMPT_V1 = `
You are a planetary scientist describing an exoplanet to a curious explorer.

The following planetary parameters have been computed by the physics simulation engine:
{PLANETARY_STATE_JSON}

Your task: Write a 2-3 sentence description of this world as it would be experienced.

Rules:
- Do NOT generate any numerical values of your own
- Do NOT contradict or override the computed parameters
- Translate numbers into felt experiences (e.g., "gravity" → "what standing feels like")
- If any parameter suggests scientific interest, mention it
- If any parameter falls outside habitable ranges, describe what that means experientially
`;
```

### Labeling Speculation

All AI-generated content that is speculative (not directly derivable from physics state) must be tagged:

```typescript
interface AIContent {
  text: string;
  type: 'description' | 'explanation' | 'speculation';
  /** Only present for speculation — describes the basis for the extrapolation */
  speculationBasis?: string;
}
```

Speculation must be visually distinct in the UI (e.g., italicized, prefixed with "Scientists speculate that...").

---

## 8. Rendering Pipeline Standards

### The Renderer's Contract

The renderer is a **pure function of physics state**. Given the same `PlanetaryState`, it must produce the same visual output.

```typescript
// Conceptual contract
type RenderFrame = (state: PlanetaryState, camera: CameraState) => void;
```

### Parameter Derivation Examples

| Visual Parameter | Derived From |
|---|---|
| Sky color (zenith) | Atmospheric Rayleigh/Mie scattering coefficients, stellar spectrum |
| Horizon haze color | Atmospheric optical depth, particulate composition |
| Star apparent size | Stellar radius + orbital distance |
| Star color | Effective stellar temperature (blackbody approximation) |
| Terminator sharpness | Atmospheric density (thick atmosphere = soft terminator) |
| Cloud layer altitude | Atmospheric pressure and water vapor fraction |
| Surface color | Surface composition weighted by albedo |
| Aurora presence | Planetary magnetic field strength + stellar wind intensity |

No visual parameter may be a constant. Every visual parameter must be a function of physics state.

### Rendering Layer Separation

Render passes must be strictly ordered and separated:

```
Pass 1: Space environment (stars, nebulae)
Pass 2: Stellar disk
Pass 3: Planet sphere + terrain
Pass 4: Clouds
Pass 5: Atmosphere (Rayleigh scattering, limb brightening)
Pass 6: Lens effects (if any — use sparingly)
Pass 7: UI overlay
```

No pass may read from a later pass's output.

### No Artistic Overrides

Artistic intervention is limited to:

- Tone mapping and HDR parameters (document defaults and rationale)
- Noise functions used in terrain generation (document seeds and algorithms)
- Level-of-detail thresholds (document and test)

Artistic overrides that contradict physics outputs are never permitted. If a result "looks wrong," investigate the physics — do not patch the renderer.

---

## 9. Engineering Standards

### Code Quality Requirements

Every file merged to `main` must be:

| Requirement | Definition |
|---|---|
| **Production ready** | No debug logs, no `TODO`s, no commented-out code blocks |
| **Typed** | Full TypeScript types, no implicit `any`, strict mode enabled |
| **Documented** | All exported functions have JSDoc; all modules have a header comment |
| **Testable** | All physics functions are pure and unit-testable with no setup |
| **Deterministic** | Identical inputs produce identical outputs with no side effects |

### What to Avoid

| Anti-Pattern | Why Banned |
|---|---|
| Magic numbers | Untraceable, un-citeable, maintainability hazard |
| Placeholder logic | Deceptive test coverage, technical debt that never gets paid |
| Duplicated logic | Inconsistency risk when physical models are refined |
| Premature optimization | Obscures correctness; optimize only after profiling |
| Inline physics in components | Violates architecture boundaries |
| `// TODO: fix later` | "Later" never comes; open a GitHub issue instead |
| `any` in TypeScript | Defeats type safety throughout the data pipeline |
| Commented-out code blocks | Use git history instead |

### What to Favor

| Pattern | Why |
|---|---|
| Pure functions | Testable, deterministic, composable |
| Single responsibility | Easier to test, easier to replace when science improves |
| Explicit parameter passing | No hidden state dependencies in physics calculations |
| Descriptive naming | Physics is already abstract; names must carry meaning |
| Const over let | Immutability by default in simulation state |
| Early returns | Reduce nesting in complex calculations |

### File Size Limits

| File Type | Max Lines | Action if Exceeded |
|---|---|---|
| Physics calculation module | 300 lines | Split by physical domain |
| React component | 200 lines | Extract sub-components |
| Utility / helper | 150 lines | Split by responsibility |
| Type definition file | 200 lines | Split by domain |
| Test file | Unlimited | Group by feature |

---

## 10. TypeScript Standards

### Compiler Configuration

The project must run with `strict: true` in `tsconfig.json`. All options implied by strict mode are non-negotiable:

- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictPropertyInitialization`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`

### Type Design for Physics

Physics values must carry their units in the type or variable name:

```typescript
// ✅ Correct — units are explicit
interface OrbitalParameters {
  semiMajorAxisMeters: number;
  orbitalPeriodSeconds: number;
  eccentricity: number; // dimensionless — no unit suffix needed
  inclinationRadians: number;
}

// ❌ Wrong — units are ambiguous
interface OrbitalParameters {
  semiMajorAxis: number;
  period: number;
  inclination: number;
}
```

### Branded Types for Physical Quantities

For critical physical quantities where unit confusion could produce silent bugs, use branded types:

```typescript
type Kelvin = number & { readonly _brand: 'Kelvin' };
type Meters = number & { readonly _brand: 'Meters' };
type Kilograms = number & { readonly _brand: 'Kilograms' };
type Pascals = number & { readonly _brand: 'Pascals' };

const toKelvin = (celsius: number): Kelvin => (celsius + 273.15) as Kelvin;
```

### No Implicit Any in Physics Layer

The physics layer must compile with zero `any` types. If a value's type is unknown, define a discriminated union or generic type that captures the range of possibilities.

---

## 11. Testing Standards

### Test Coverage Requirements

| Module | Required Coverage |
|---|---|
| `physics/` — all calculation functions | 100% line coverage |
| `translation/` | 100% line coverage |
| `renderer/` — parameter derivation | 80% line coverage |
| `store/` | 80% line coverage |
| `ai/` — prompt construction | 80% line coverage |
| `ui/` components | Snapshot + interaction tests for key components |

### Physics Test Standards

Every physics function must have tests that cover:

1. **Earth-analogue case** — inputs matching Earth's parameters should produce values close to Earth's known values
2. **Boundary conditions** — minimum and maximum valid inputs
3. **Edge cases** — zero mass, zero atmosphere, tidally locked orbits
4. **Known exoplanet cases** — at least one test per function using parameters from a published, characterized exoplanet (cite the source)

```typescript
describe('computeEquilibriumTemperature', () => {
  it('produces ~255K for Earth (bare rock, no greenhouse)', () => {
    const result = computeEquilibriumTemperature(
      SOLAR_EFFECTIVE_TEMPERATURE_K,
      SOLAR_RADIUS_M,
      EARTH_SEMI_MAJOR_AXIS_M,
      0.3, // Earth Bond albedo
    );
    expect(result).toBeCloseTo(255, 0); // ±0.5K
  });

  it('produces ~210K for Mars (bare rock, no greenhouse)', () => {
    const result = computeEquilibriumTemperature(
      SOLAR_EFFECTIVE_TEMPERATURE_K,
      SOLAR_RADIUS_M,
      MARS_SEMI_MAJOR_AXIS_M,
      0.25,
    );
    expect(result).toBeCloseTo(210, 0);
  });
});
```

### Test Naming Convention

```
describe('<FunctionName>')
  it('<does what> when <condition>')
  it('returns <expected> for <specific named case>')
```

### What Not to Test

- Internal implementation details that will change as models improve
- Visual output of the renderer (screenshot tests are fragile)
- AI-generated text content (non-deterministic)

---

## 12. Documentation Standards

### Module Header Comments

Every module must begin with a header block:

```typescript
/**
 * @module physics/atmosphere
 *
 * Atmospheric composition modeling and retention analysis.
 *
 * Models implemented:
 *   - Jeans escape parameter for atmospheric retention
 *   - Scale height calculation
 *   - Mean molecular weight from composition
 *   - Simplified greenhouse forcing (linear approximation)
 *
 * Assumptions:
 *   - Well-mixed atmosphere (single-layer model)
 *   - Hydrostatic equilibrium
 *   - No photochemistry in MVP
 *
 * Future work:
 *   - Photochemical modeling
 *   - Vertical temperature structure
 *   - Condensation and cloud coupling
 */
```

### Architecture Decision Records

Significant architectural decisions must be recorded in `docs/adr/`:

```
docs/adr/
├── 001-physics-owns-all-values.md
├── 002-renderer-reads-only.md
├── 003-ai-no-simulation-influence.md
├── 004-deterministic-seeding.md
```

Each ADR must include:
- **Context**: What problem were we solving?
- **Decision**: What did we decide?
- **Rationale**: Why?
- **Consequences**: What does this make easier? What does it make harder?
- **Alternatives considered**: What else did we consider and reject?

### Scientific Reference Index

All scientific papers and data sources used must be recorded in `docs/references.md` with:
- Full citation
- DOI or URL
- Which module(s) use it
- What it is used for

---

## 13. Git & Commit Policy

### Commit Frequency

Commit **aggressively**. Never allow large batches of work to accumulate in an uncommitted state.

| Preferred changeset | ≤ 300 lines |
|---|---|
| **Absolute maximum changeset** | **500 lines — no exceptions** |

If a feature requires more than 500 lines to implement, it must be broken into multiple commits along natural seams (type definitions, core logic, tests, documentation).

### When to Commit

Commit after completing any of the following — do not bundle them:

| Trigger | Example Commit |
|---|---|
| Architecture skeleton | `feat(physics): scaffold atmosphere module structure` |
| Type definitions | `types(physics): define PlanetaryState and OrbitalParameters` |
| Feature implementation | `feat(habitability): implement Kopparapu HZ boundary calculator` |
| Test suite | `test(habitability): add HZ boundary tests including Kepler-442 case` |
| Refactor | `refactor(renderer): extract atmosphere scattering into dedicated pass` |
| Documentation | `docs(atmosphere): document Jeans escape assumptions and limitations` |
| Bug fix | `fix(climate): correct albedo weighting for ice-covered surfaces` |
| Constants addition | `feat(constants): add IAU 2015 nominal solar values` |

### Pre-Commit Checklist

Before every commit, without exception:

- [ ] `npm run test` — all tests pass
- [ ] `npm run lint` — zero errors, zero warnings
- [ ] `npm run typecheck` — zero TypeScript errors
- [ ] No `console.log`, `debugger`, or commented-out code blocks
- [ ] No `TODO` comments — open GitHub issues instead
- [ ] No `any` types introduced
- [ ] All new functions have JSDoc

### Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready, always green |
| `feature/<name>` | Feature development |
| `fix/<name>` | Bug fixes |
| `refactor/<name>` | Refactoring without behavior change |
| `docs/<name>` | Documentation only |
| `science/<name>` | Physics model research / experimental |

`science/` branches are the only place where incomplete or speculative physics work may live.

### Push Policy

Push after every commit. Never leave commits local.

---

## 14. Commit Messages

### Format

```
<type>(<scope>): <imperative short description>

[optional body — explain WHY, not WHAT]

[optional footer — breaking changes, issue refs]
```

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `test` | Tests only |
| `docs` | Documentation only |
| `types` | TypeScript type definitions only |
| `perf` | Performance improvement (with benchmark data) |
| `science` | Physics model addition or refinement |
| `chore` | Build, tooling, dependency changes |

### Scopes

Use the module directory name as the scope:

`physics`, `stellar`, `orbital`, `planetary`, `atmosphere`, `climate`, `habitability`, `renderer`, `ai`, `translation`, `store`, `ui`, `types`, `constants`, `docs`

### Quality Bar

The commit message must allow a future engineer to **understand the repository history without opening the diff**.

| ❌ Bad | ✅ Good |
|---|---|
| `feat: physics` | `feat(orbital): implement Keplerian period calculator with test against Earth` |
| `fix bug` | `fix(atmosphere): correct molecular weight for CO2-dominated atmospheres` |
| `update stuff` | `refactor(renderer): separate cloud layer into dedicated render pass` |
| `wip` | Never commit WIP to main — use feature branches |
| `add tests` | `test(habitability): add HZ boundary tests for M-dwarf star cases` |
| `docs` | `docs(architecture): document renderer read-only constraint in ADR-002` |

### Git Trailer Policy

**Claude must never add itself to commits.**

Never add to any commit:

```
Co-Authored-By: Claude <...>
Generated-By: Claude
AI-Generated: true
```

No commit trailers of any kind should be added automatically. Commit attribution belongs exclusively to the repository owner.

---

## 15. UX Philosophy & Translation Layer

### The Core Principle

> Users should learn physics without realizing they are learning physics.

Every number the physics engine produces must be translated into a **felt experience** before it reaches the user.

### Translation Examples

| Physics Output | ❌ Raw Display | ✅ Human Translation |
|---|---|---|
| `gravity = 1.8g` | "Gravity: 1.8g" | "Walking feels nearly twice as difficult as on Earth" |
| `dayLength = 259200s` | "Day length: 72 hours" | "A single sunrise occurs every three Earth days" |
| `surfaceTemp = 340K` | "Temperature: 340K" | "Comparable to the hottest deserts on Earth — liquid water could persist in shade" |
| `atmPressure = 0.1 bar` | "Pressure: 0.1 bar" | "Equivalent to Earth's atmosphere at the summit of Everest — unbreathable without a suit" |
| `escapeVelocity = 5.2 km/s` | "Escape velocity: 5.2 km/s" | "Lighter than Earth — rockets require less energy to reach orbit" |
| `orbitalPeriod = 687 days` | "Year: 687 days" | "A full year lasts nearly two Earth years" |
| `magneticField = 0.05 T` | "Magnetic field: 0.05 T" | "A weak magnetic field offers limited protection from stellar radiation" |

### Translation Layer Architecture

```typescript
// src/translation/index.ts
export interface HumanTranslation {
  /** Short phrase for UI labels */
  brief: string;
  /** Full sentence for narrative descriptions */
  narrative: string;
  /** Optional comparison anchor */
  earthComparison?: string;
}

export function translateGravity(g: number): HumanTranslation;
export function translateDayLength(seconds: number): HumanTranslation;
export function translateSurfaceTemperature(kelvin: number): HumanTranslation;
// ... one function per physical dimension
```

Translation functions must be pure and unit-tested. They receive physics values and return human strings. No other logic.

### Avoid Condescension

Translations must inform, not simplify into meaninglessness.

| ❌ Too Simple | ✅ Informative |
|---|---|
| "Really hot!" | "Hot enough to melt lead on the surface" |
| "Very heavy gravity" | "Standing still would feel like carrying a second person on your back" |
| "Thin air" | "The atmospheric pressure here would require supplemental oxygen — similar to the summit of Everest" |

### Show the Physics Too

The raw physics value should always be accessible — translation supplements it, not replaces it.

```
Surface Temperature
  ──────────────────
  Hot enough to melt lead on the surface
  727°C  |  1000 K  |  1341°F
```

---

## 16. Long-Term Vision & Roadmap

### MVP Scope

The MVP must establish the **foundational architecture** for all future modules without implementing them prematurely. MVP scope:

- [ ] Stellar parameter input (type, mass, age)
- [ ] Orbital parameter input (semi-major axis, eccentricity)
- [ ] Planetary parameter input (mass, radius, composition class)
- [ ] Atmospheric composition input (major components)
- [ ] Physics engine: equilibrium temperature, surface gravity, escape velocity, orbital period, habitable zone position
- [ ] Basic atmosphere retention analysis
- [ ] Human translation layer for all computed values
- [ ] Basic 3D planet renderer (sphere + atmosphere scattering)
- [ ] AI description layer (narrative description of computed world)
- [ ] Shareable world URL (deterministic from parameters)

### Architecture Must Support Future Modules

Every architecture decision must be evaluated against this future module list. If a decision would make any of these harder to add, it requires explicit justification.

| Future Module | Architecture Implication |
|---|---|
| **Sky Rendering** | Renderer must accept stellar spectrum as input; atmosphere optical depth must be computed |
| **Climate Modeling** | Physics engine must support iterative energy balance; greenhouse coupling required |
| **Evolution Simulation** | Habitability must produce a structured output, not a boolean |
| **Civilization Projection** | Requires stable, versioned `PlanetaryState` serialization format |
| **Stellar System Design** | Physics engine must support multi-body systems; orbital resonance detection required |
| **Terraforming Simulation** | State must be mutable over time with a well-defined change log |
| **Scientific Report Generation** | All physics values must carry citations and confidence levels |
| **Educational Exploration** | Translation layer must be comprehensive; every value must have a human analog |

### Versioning of Planetary State

From day one, `PlanetaryState` must be versioned:

```typescript
interface PlanetaryState {
  /** Schema version — increment on any breaking change */
  version: string;
  // ... all computed properties
}
```

Shared planet URLs must remain valid as the schema evolves. Build a migration layer from the start.

---

## 17. Dependency Policy

### Before Adding a Dependency

Ask in order:

1. **Can this be implemented in < 50 lines of well-tested physics code?** If yes, implement it. Do not import a library.
2. **Is this dependency actively maintained?** Check last commit date and open issues.
3. **Does it have TypeScript types?** Required for physics and rendering libraries.
4. **Does it have a permissive license?** MIT, Apache 2.0, BSD only. No GPL in production code.
5. **Does it add significant bundle weight?** If > 50KB, evaluate lazy loading.

### Physics Calculations

**Never use a third-party library to perform physics calculations that are core to the simulation.** If you need to implement a gravitational calculation, implement it. Own the code. Understand the math.

Acceptable uses of external libraries:

- `three.js` or equivalent for 3D rendering
- Noise libraries for deterministic terrain generation (document the algorithm)
- Math utilities for matrix operations (not physics equations)
- UI component libraries

### Dependency Freeze Policy

Dependencies must be pinned to exact versions in `package.json` (no `^` or `~`). Upgrades are deliberate, tested, and committed as `chore(deps):` commits.

---

## 18. Performance Budgets

### Simulation Performance

| Operation | Target | Maximum |
|---|---|---|
| Full planetary state recalculation | < 1ms | 5ms |
| Translation layer (all values) | < 0.5ms | 2ms |
| Renderer frame (60fps target) | < 16ms | 20ms |
| AI narrative generation (async) | N/A — show loading state | — |

### Bundle Size

| Bundle | Target | Maximum |
|---|---|---|
| Core physics + translation | < 50KB gzipped | 100KB |
| Renderer (excluding Three.js) | < 100KB gzipped | 200KB |
| Total initial load | < 500KB gzipped | 1MB |

### Profiling Before Optimizing

No optimization without a profiling result that justifies it. All optimizations must include:

- Before/after benchmark numbers
- The profiling tool and methodology
- A comment in the code explaining the optimization

---

## 19. Error Handling Standards

### Physics Engine Errors

The physics engine must **never silently return invalid values**. Invalid inputs must produce explicit errors.

```typescript
class PhysicsRangeError extends Error {
  constructor(
    parameter: string,
    value: number,
    validRange: [number, number],
    unit: string,
  ) {
    super(
      `Physics parameter out of range: ${parameter} = ${value} ${unit}. ` +
      `Valid range: [${validRange[0]}, ${validRange[1]}] ${unit}`
    );
    this.name = 'PhysicsRangeError';
  }
}
```

### Input Validation

Every physics function must validate its inputs at the boundary:

```typescript
export function computeSurfaceGravity(massKg: number, radiusM: number): number {
  if (massKg <= 0) throw new PhysicsRangeError('mass', massKg, [0, Infinity], 'kg');
  if (radiusM <= 0) throw new PhysicsRangeError('radius', radiusM, [0, Infinity], 'm');
  // ...
}
```

### Error Propagation to UI

Physics errors must never crash the UI. The store layer must catch physics errors and translate them into user-visible diagnostic messages:

```typescript
interface SimulationDiagnostic {
  severity: 'info' | 'warning' | 'error';
  parameter: string;
  message: string;
  /** Human-readable explanation of why this combination is physically unusual */
  explanation: string;
}
```

---

## 20. Naming Conventions

### Files and Directories

| Pattern | Convention |
|---|---|
| Directories | `kebab-case` |
| TypeScript files | `camelCase.ts` |
| React components | `PascalCase.tsx` |
| Test files | `<filename>.test.ts` |
| Type-only files | `<domain>.types.ts` |
| Constants files | `<domain>.constants.ts` |

### Variables and Functions

| Pattern | Convention | Example |
|---|---|---|
| Physics functions | `compute<Result>` | `computeSurfaceGravity` |
| Estimation functions | `estimate<Result>` | `estimateRadiusFromMass` |
| Translation functions | `translate<Quantity>` | `translateGravity` |
| Validation functions | `validate<Target>` | `validateAtmosphericComposition` |
| Physical constants | `SCREAMING_SNAKE_CASE` | `GRAVITATIONAL_CONSTANT_G` |
| Physics values in code | `camelCase` with unit suffix | `massKilograms`, `radiusMeters` |
| Dimensionless quantities | `camelCase` without unit suffix | `albedo`, `eccentricity` |

### Type Names

| Pattern | Convention | Example |
|---|---|---|
| Physics state objects | `<Domain>State` | `AtmosphericState`, `OrbitalState` |
| Input parameter objects | `<Function>Input` | `HabitabilityInput` |
| Result objects | `<Function>Result` | `HabitabilityResult` |
| Configuration objects | `<Module>Config` | `RendererConfig` |
| Enum types | `PascalCase` | `StellarClass`, `AtmosphericComposition` |

---

*This document is a living specification. Every team member is expected to propose amendments via pull request. Every amendment requires a clear rationale. The physics hierarchy — and the architectural separations that enforce it — are permanent.*

*Last reviewed: Project Exogenesis v0.1 — MVP Architecture Phase*