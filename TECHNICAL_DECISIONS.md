# Project Exogenesis — Technical Decisions

**Status:** Living document
**Relationship to ADRs:** This is the running decision log. Decisions marked *significant* will be expanded into full records under `docs/adr/` as they are implemented (per CLAUDE.md §12).

Where `.claude/CLAUDE.md` and `docs/ARCHITECTURE.md` diverge, CLAUDE.md governs (it declares itself the single source of truth); the reconciliation is recorded here so the divergence is deliberate, not accidental.

---

## TD-001 — Language & Platform: TypeScript (strict) on the web

**Decision:** The entire system — physics engine included — is TypeScript compiled for the browser, with `strict: true` and zero `any` in the physics layer.

**Rationale:** CLAUDE.md defines the product as a web experience and specifies TypeScript standards throughout. A single language keeps the physics → translation → UI pipeline type-safe end to end.

**Consequences:** Physics runs on IEEE 754 Float64 (JS `number`). See TD-002 for the determinism implications.

## TD-002 — Determinism: ECMAScript Float64 semantics, not fixed-point arithmetic

**Decision:** Physics calculations use native JS doubles. Determinism is guaranteed by: no `Math.random()` in physics, explicit documented seeds for all procedural variation, and avoidance of implementation-defined transcendental behavior where bitwise reproducibility matters (prefer algebraic forms; document any `Math.pow`/`Math.exp` use).

**Reconciliation:** ARCHITECTURE.md §3.2 calls for fixed-point or software floats to eliminate cross-architecture drift. That guardrail targets compiled multi-platform engines (x87 vs SSE). ECMAScript already mandates IEEE 754 binary64 for arithmetic operators, so the drift class it defends against does not exist for `+ - * /` in JS. Transcendental functions (`Math.sin`, `Math.exp`, …) are implementation-defined; if a future feature (shareable-URL bitwise verification, cross-engine replay) demands bitwise identity across browsers, we will introduce deterministic software implementations for those functions only — scoped, not a wholesale fixed-point rewrite.

**Alternatives considered:** fixed-point arithmetic (rejected: massive complexity, precision loss in physics ranges spanning 30 orders of magnitude); WASM with a pinned math library (deferred until proven necessary by an actual reproducibility failure).

## TD-003 — Simulation model: recompute-on-input-change, not a fixed-timestep tick loop

**Decision:** The MVP physics engine is a pure function: `(validated inputs) → PlanetaryState`. It computes steady-state properties (equilibrium temperature, orbital period, retention fractions), so there is no time integration and therefore no tick system.

**Reconciliation:** ARCHITECTURE.md §3.2 specifies a fixed-timestep tick system. That applies to time-evolving simulation (terraforming, evolution, climate iteration). When those modules arrive, they get a fixed-Δt loop *around* the pure core — the core function stays timeless. This also defers ARCHITECTURE.md §4.1's zero-allocation pool strategy: a sub-millisecond pure recompute (CLAUDE.md §18 budget) does not need pre-allocated pools; that strategy becomes relevant with per-tick allocation pressure.

## TD-004 — State transfer: immutable versioned TypeScript objects, not Protocol Buffers (MVP)

**Decision:** `PlanetaryState` is a frozen, plain TS object with a `version` field from day one. Subsystems receive it read-only via the store.

**Reconciliation:** ARCHITECTURE.md §1 suggests protobuf/flat binary snapshots. Binary schemas earn their cost when state crosses process or network boundaries. In a single-page app, typed immutable objects give the same isolation guarantees with zero serialization overhead. The versioned schema means a binary encoding can be added later (shareable URLs, report signing) without redesign — the URL serialization format (Phase 8) is the first place a stable wire encoding will exist.

## TD-005 — Error handling: typed exceptions at physics boundaries, caught at the store

**Decision:** Physics functions validate inputs and throw `PhysicsRangeError` on invalid values (CLAUDE.md §19). The store layer is the exception boundary: it catches physics errors and converts them to `SimulationDiagnostic` values. No exception ever propagates to the UI or renderer.

**Reconciliation:** ARCHITECTURE.md §4.2 mandates no-exception outcome structs throughout. We adopt its *intent* (the pipeline never crashes; failures become typed diagnostics) while following CLAUDE.md's letter at the function level, because CLAUDE.md governs and idiomatic TS validation-throwing keeps physics signatures clean (`number`, not `Result<number>`). Computed results that carry scientific uncertainty (not errors) use explicit result types with `confidence` fields per CLAUDE.md §6.

## TD-006 — Architectural boundary enforcement: lint-time import rules

**Decision:** Module boundaries (CLAUDE.md §4) are enforced mechanically with ESLint import-restriction rules: `physics/` may import nothing from `renderer/`, `ai/`, `ui/`, or any graphics/ML runtime; `renderer/` and `ai/` may import only `physics/` type definitions; nothing imports from `ui/` except `ui/`. Violations fail CI, implementing ARCHITECTURE.md §3.2's compilation-failure guardrail.

## TD-007 — Rendering: Three.js as the only rendering dependency

**Decision:** Three.js for scene/GPU management (permitted by CLAUDE.md §17). All visual parameters are derived in our own code from `PlanetaryState`; Three.js receives only the derived values. No physics in shaders beyond the scattering math that *is* the visual derivation, which is documented like any physics module.

## TD-008 — AI layer: provider-agnostic client, versioned prompts, read-only context

**Decision:** The AI layer receives `PlanetaryState` as structured JSON context, uses semantically versioned prompt templates in `src/ai/prompts/`, and types every output as `AIContent` (`description` | `explanation` | `speculation`). It has no import path to physics calculations and no write path to any store the simulation reads.

**Deferred:** ARCHITECTURE.md §3.5's MCP + local-vector-database RAG design is post-MVP; the MVP narrator needs only the state snapshot as context. The prompt-versioning and read-only contracts are designed so the RAG upgrade changes retrieval, not architecture.

## TD-009 — Habitability output: structured matrix, never a boolean or single score

**Decision:** The habitability module returns a structured result: per-model scores (human baseline first; extremophile and speculative models later per ARCHITECTURE.md §3.4), contributing factors, confidence labels, and caveats. Required pre-commitment for the Evolution module (CLAUDE.md §16). Conservative bias: under uncertainty, prefer false negatives for habitability.

## TD-010 — Testing: every physics function anchored to published reality

**Decision:** Test framework with per-module coverage gates (100% physics/translation, 80% renderer-derivation/store/ai-prompts). Every physics function tests an Earth-analogue, boundaries, edge cases, and ≥1 published exoplanet with citation. No screenshot tests of renderer output; no tests of AI-generated text.

## TD-011 — Dependencies: exact pins, no physics libraries

**Decision:** All versions pinned exactly (no `^`/`~`); upgrades are deliberate `chore(deps):` commits. Core physics is always implemented in-repo with cited models — never imported. Permissive licenses only (MIT/Apache-2.0/BSD).

## TD-012 — Configuration ingestion: validated manifest with deterministic hash

**Decision:** All user inputs pass through the Planet Configuration System, which performs range, dimensional, and relational validation, then emits a `ConfigurationManifest` with a deterministic content hash. The hash is the identity of a world: it keys shareable URLs (Phase 8) and, later, report authenticity signing (ARCHITECTURE.md §3.6).

## TD-013 — Future engines integrate as plugins; terraforming intercepts inputs, never state

**Decision:** Post-MVP engines (evolution, civilization, terraforming) register through a version-checked interface contract (ARCHITECTURE.md §5) and attach only at sanctioned hook points. Terraforming specifically operates as middleware between configuration and physics — it mutates *inputs over time*, preserving the physics engine as a pure function and the unidirectional data flow as absolute.

---

## Open questions (to be resolved as ADRs before the relevant phase)

1. **Store library** (Phase 5): minimal hand-rolled store vs. Zustand-class library — decide against bundle budget and immutability ergonomics.
2. **Greenhouse forcing model** (Phase 2): which published simplified radiative forcing parameterization satisfies "not linear interpolation of temperature" while staying within MVP scope — requires literature selection and citation.
3. **Deterministic transcendental functions** (Phase 8): whether URL-shared worlds need bitwise-identical recomputation across browsers or tolerance-based equality suffices.
