# ADR-006: Renderer Built on Raw Three.js, Framework-Agnostic

**Status:** Accepted
**Date:** 2026-06-11

## Context

Phase 6b adds the 3D renderer. CLAUDE.md §17 pre-approves Three.js for rendering, and §8 mandates a **strictly ordered set of render passes** (space → stellar disk → planet → clouds → atmosphere → lens → UI overlay), with the renderer a **pure function of `PlanetaryState`**. ARCHITECTURE.md §3.3 frames the visualization engine as a decoupled downstream consumer of immutable state. The choice was how to build on Three.js: raw/imperative, or via react-three-fiber (R3F), a declarative React renderer for Three.js.

## Decision

Build the renderer as an imperative, framework-agnostic module over raw Three.js — conceptually `render(state: PlanetaryState, camera): void` — that React merely mounts into a `<canvas>` via an effect. No R3F.

## Rationale

- **Explicit pass ordering.** §8's seven-pass contract maps directly onto imperative, hand-ordered render calls. R3F manages its own render loop and scene-graph reconciliation, which would have to be overridden to guarantee the mandated order — fighting the abstraction.
- **Framework-agnostic, decoupled.** Keeping the renderer free of React matches ARCHITECTURE.md §3.3 (a presentation layer that reads state through a channel) and ADR-002 (renderer is a pure function of state). The renderer could be driven from a worker or a non-React host unchanged.
- **Smaller dependency surface.** Adds only `three`, not `three` + the R3F reconciler — better against the §18 bundle budget.
- **Testable derivation.** The visual-parameter derivation (state → colors, sizes, scattering coefficients) is pure and unit-testable at the §11 80% gate, independent of the imperative GPU wiring (which §11 explicitly says not to screenshot-test).

## Consequences

**Easier:** guaranteeing §8 pass order; keeping the renderer a pure, mountable function; swapping the React host; reasoning about the render loop explicitly.

**Harder:** more imperative boilerplate than R3F's declarative JSX; we manage the animation loop, resource disposal, and canvas resize ourselves rather than getting them from the ecosystem.

## Alternatives Considered

- **react-three-fiber:** rejected — declarative and productive, but React-coupled and loop-abstracting in ways that work against §8's explicit ordering and the framework-agnostic-renderer intent. Its ecosystem (drei) is not needed for the MVP's sphere + atmosphere + star.
- **A higher-level engine (Babylon.js, PlayCanvas):** rejected — heavier, and §17 already names Three.js.
