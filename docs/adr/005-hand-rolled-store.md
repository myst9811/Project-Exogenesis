# ADR-005: Hand-Rolled Pub/Sub Store, Framework-Agnostic

**Status:** Accepted
**Date:** 2026-06-11

## Context

The store layer (CLAUDE.md §3: `simulation.ts`, `ui.ts`, `history.ts`) mediates between user inputs and the physics engine: physics writes `PlanetaryState`, all consumers subscribe read-only, and the UI submits parameter changes as typed inputs through store actions (§4 boundary table). It also captures physics errors as `SimulationDiagnostic` values so they never crash the UI (§19), and maintains an undo/redo history.

The open question (TECHNICAL_DECISIONS.md) was whether to hand-roll this or adopt a library such as Zustand. React is deliberately deferred to Phase 6, so the store core must be framework-agnostic regardless.

## Decision

Implement a small hand-rolled pub/sub store in pure TypeScript, with no runtime dependencies. A generic `createStore` primitive (get/set/subscribe over immutable state) underpins three typed stores: the simulation store, the UI-only store, and the history stack.

## Rationale

- **The dependency policy answers it.** CLAUDE.md §17 asks first: "Can this be implemented in < 50 lines of well-tested code? If yes, implement it." A typed pub/sub store with immutable replacement is ~40 lines. The rule is near-determinative here.
- **Framework-agnostic by construction.** Zustand's primary value is its React bindings — which belong in `ui/`, not `store/`. A plain store keeps the architectural separation intact and lets Phase 6 add a thin React adapter (`useSyncExternalStore`) without coupling the core to React.
- **Zero bundle cost** against the tight §18 budget, and **100% testable** with no framework harness — matching the store's 80% coverage gate with room to spare.
- **Full control over the contract** the architecture mandates: read-only snapshots for consumers, write access only via typed actions, and stale-result rejection for the async recompute.

## Consequences

**Easier:** testing (pure, synchronous subscribe/snapshot); enforcing the unidirectional-flow and immutability rules exactly; swapping in a React adapter later without touching store logic; auditing (no third-party state semantics to reason about).

**Harder:** we write our own subscribe/snapshot plumbing (small, but ours to maintain); a React adapter is a separate Phase 6 task rather than free hooks.

## Alternatives Considered

- **Zustand** (~1 KB, well maintained): rejected — its main benefit is React-coupled and would live in the wrong layer; the core is small enough that the dependency does not pay for itself under §17.
- **Redux Toolkit:** rejected — far heavier than the problem; ceremony and bundle cost unjustified for a single-page deterministic simulator.
- **Signals library (e.g. preact/signals):** rejected — another framework-flavored dependency for plumbing we can own in tens of lines.
