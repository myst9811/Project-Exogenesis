# ADR-001: The Physics Engine Owns All Computed Values

**Status:** Accepted
**Date:** 2026-06-10

## Context

Project Exogenesis presents users with planetary properties (gravity, temperature, pressure, orbital period) and lets them adjust input parameters. Without a clear ownership rule, computed values could originate anywhere: a UI slider could set "temperature" directly, the renderer could invent a sky color, or the AI layer could "correct" a number it considers wrong. Once multiple sources of truth exist, scientific defensibility — the project's core standard — is unrecoverable.

## Decision

Every value in the simulation is computed by the physics engine from validated inputs and cited models. The hierarchy is absolute: physics → visuals → AI, with no layer influencing the layer above. Sliders produce *inputs*; the engine produces *outputs*. If a value cannot be derived from physics, it does not exist in the simulation.

## Rationale

- A single source of truth makes every displayed number traceable to a documented equation with a citation — the "physically defensible" bar of CLAUDE.md §1.
- Pure input→state computation is deterministic and trivially testable against published planetary data.
- Future modules (terraforming, evolution, report generation) compose cleanly when they can trust that `PlanetaryState` has exactly one producer.

## Consequences

**Easier:** testing (pure functions, Earth-analogue anchors), reproducibility (shareable URLs), auditing (every value has a provenance), future time-evolution modules (they wrap the pure core).

**Harder:** quick visual tweaks — if a rendered result looks wrong, the physics must be investigated rather than the output patched; authoring "designed" worlds requires finding inputs that produce them.

## Alternatives Considered

- **Authored values with physics validation** (designer sets temperature, physics checks plausibility): rejected — produces internally inconsistent worlds and unfalsifiable displays.
- **Bidirectional solving** (user pins an output, engine solves for inputs): deferred — useful UX, but it must be implemented as input search around the pure engine, never as output override.
