# Project Exogenesis — Roadmap

**Status:** Active
**Derived from:** `.claude/CLAUDE.md` §16 (Long-Term Vision & Roadmap) and `docs/ARCHITECTURE.md` v2.0.0-RC
**Governing constraint:** Every phase must preserve the physics → visuals → AI hierarchy and must not make any future module harder to add.

---

## Guiding Sequence

The build order follows the data pipeline itself: nothing downstream is built before the upstream layer it consumes is real. The physics engine is implemented first, the renderer and AI layers only ever read from it.

```
Phase 0  Tooling & scaffolding
Phase 1  Types, constants, configuration ingestion
Phase 2  Physics engine (MVP calculations)
Phase 3  Habitability analysis
Phase 4  Translation layer
Phase 5  Store & UI inputs
Phase 6  Renderer (basic planet + atmosphere)
Phase 7  AI description layer
Phase 8  Shareable world URLs
```

---

## Phase 0 — Tooling & Scaffolding

Establish the engineering substrate required by the pre-commit checklist before any feature code exists.

- [x] TypeScript project with `strict: true` and all CLAUDE.md §10 compiler options
- [x] Test runner with per-module coverage gates (physics/translation: 100%)
- [x] Linting with zero-warning policy
- [x] `npm run test`, `npm run lint`, `npm run typecheck` scripts (required by pre-commit checklist)
- [x] Architectural lint rules enforcing module import boundaries (CLAUDE.md §4, ARCHITECTURE.md §3.2 guardrail)
- [x] Directory skeleton matching CLAUDE.md §3 module map
- [x] Exact-version dependency pinning (no `^`/`~`)

**Exit criterion:** an empty module in each directory compiles, lints, and runs one trivial test.

## Phase 1 — Types, Constants & Configuration

- [x] `src/types/physics.ts`: versioned `PlanetaryState` schema (version field from day one)
- [x] Input parameter types per ARCHITECTURE.md §3.2 I/O contract (mass, radius, atmosphere composition, orbital distance, star type, rotation period, axial tilt — with unit suffixes)
- [x] `src/physics/constants.ts`: cited physical constants (NIST CODATA, IAU nominal values)
- [x] Planet Configuration System: input validation (range bounding, dimensional checks, relational checks) producing a hashed `ConfigurationManifest`
- [x] `PhysicsRangeError` and `SimulationDiagnostic` types (CLAUDE.md §19)
- [x] First ADRs in `docs/adr/`: physics-owns-all-values, renderer-reads-only, ai-no-simulation-influence, deterministic-seeding
- [x] `docs/references.md` scientific reference index started

## Phase 2 — Physics Engine (MVP Calculations)

Each calculation lands as its own commit pair (implementation + tests), each with full JSDoc model documentation per CLAUDE.md §5.

- [x] **Stellar:** main-sequence mass–luminosity relation, effective temperature, stellar radius
- [x] **Orbital:** Keplerian orbital period from semi-major axis and stellar mass
- [x] **Planetary:** surface gravity, bulk density, escape velocity
- [x] **Climate:** equilibrium (blackbody) temperature via energy balance model; simplified greenhouse forcing delta
- [x] **Atmosphere:** mean molecular weight, scale height, surface pressure, Jeans escape retention analysis
- [x] **Habitable zone:** Kopparapu et al. (2013) HZ limits and planet position within them
- [x] Engine orchestrator: inputs → complete immutable `PlanetaryState`

**Test bar per function:** Earth-analogue case, boundary conditions, edge cases, and at least one published exoplanet case with citation (CLAUDE.md §11).

## Phase 3 — Habitability Analysis

- [ ] Structured habitability output (not a boolean — required by the Evolution Simulation future module)
- [ ] Survival-model scoring per ARCHITECTURE.md §3.4 (human baseline first; extremophile/speculative models later)
- [ ] Confidence labeling (`calculated` / `estimated` / `speculative`) on all outputs

## Phase 4 — Translation Layer

- [ ] One pure `translate<Quantity>` function per physical dimension (gravity, day length, temperature, pressure, escape velocity, orbital period, magnetic field)
- [ ] `HumanTranslation` interface: brief, narrative, Earth comparison
- [ ] 100% line coverage; raw values always preserved alongside translations

## Phase 5 — Store & UI Inputs

- [ ] Simulation store: physics writes `PlanetaryState`, all consumers subscribe read-only
- [ ] UI state store (never influences physics) and undo/redo history
- [ ] Physics error capture → `SimulationDiagnostic` surfaced to UI; errors never crash the UI
- [ ] Input panels: stellar, orbital, planetary, atmospheric parameters (typed inputs only — sliders produce inputs, never outputs)

## Phase 6 — Renderer

- [ ] Three.js scene with strictly ordered render passes (CLAUDE.md §8)
- [ ] Planet sphere with surface color derived from composition and albedo
- [ ] Atmospheric Rayleigh/Mie scattering derived from composition, pressure, and stellar spectrum
- [ ] Stellar disk: apparent size and blackbody color from physics state
- [ ] Renderer is a pure function of `PlanetaryState` + camera; zero authored visual constants

## Phase 7 — AI Description Layer

- [ ] Versioned prompt templates in `src/ai/prompts/`
- [ ] Narrator: physics state → narrative description (no numbers generated by the model)
- [ ] Educator: on-demand mechanism explanations
- [ ] Speculator: clearly labeled extrapolation with `speculationBasis`
- [ ] Async execution with loading states; AI output typed as `AIContent` with kind labels

## Phase 8 — Shareable World URLs

- [ ] Deterministic serialization of inputs (`ConfigurationManifest`) into a URL
- [ ] Schema version embedded; migration layer for old URLs from the start
- [ ] Round-trip property test: URL → state → URL is identity

---

## MVP Definition of Done

All CLAUDE.md §16 MVP checkboxes satisfied; a shared URL reproduces an identical world; a planetary scientist reviewing any computed value can trace it to a cited model.

## Post-MVP Modules (ordered by dependency, not priority)

| Module | Unblocked by | Architectural pre-commitment already made |
|---|---|---|
| Sky rendering (surface view) | Phase 6 | Renderer accepts stellar spectrum; optical depth computed |
| Climate modeling (iterative energy balance) | Phase 2 | Engine supports recomputation loops |
| Report Generation Engine | Phase 3 | Values carry citations + confidence; idempotent output |
| Evolution simulation | Phase 3 | Habitability is structured, not boolean |
| Stellar system design (multi-body) | Phase 2 | Orbital module isolated by domain |
| Terraforming simulation | Phase 8 | Implemented as input-side interceptor middleware (ARCHITECTURE.md §5); physics core untouched |
| Civilization projection | Evolution | Versioned `PlanetaryState` serialization |
| Educational exploration mode | Phase 4 | Translation layer covers every value |

Future engines integrate via the plugin contract described in ARCHITECTURE.md §5; none may write upstream.
