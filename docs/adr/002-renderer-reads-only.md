# ADR-002: The Renderer Is a Read-Only Consumer of Physics State

**Status:** Accepted
**Date:** 2026-06-10

## Context

Real-time 3D rendering traditionally accumulates artistic overrides: a sky tinted for mood, a terminator softened for beauty, clouds added because the scene looks empty. Each override silently breaks the link between what the user sees and what the physics computed, and the project's credibility rests on that link.

## Decision

The renderer is a pure function of `PlanetaryState` (plus camera state). Every visual parameter — sky color, star apparent size, terminator sharpness, cloud altitude — is derived from physics outputs. The renderer may import physics *type definitions* only, never calculation modules, and may never write to simulation state. Artistic intervention is limited to documented tone mapping, deterministic noise seeds, and level-of-detail thresholds.

## Rationale

- Honest visualization: what users see *is* the simulation, not an illustration of it.
- Identical state must produce identical frames, so visual regressions indicate physics or derivation changes, never hidden state.
- Enforced mechanically by ESLint restricted-import rules (compile-time guardrail per ARCHITECTURE.md §3.2), not by convention.

## Consequences

**Easier:** debugging visuals (one input: the state), future sky-rendering and spectrum-driven features (the data path already exists), renderer replacement.

**Harder:** aesthetic polish — "make it prettier" becomes "improve the physical derivation," which is slower but is the point.

## Alternatives Considered

- **Art-directed rendering with physics hints:** rejected — indistinguishable from a fantasy generator at the credibility level the project targets.
- **Physics-derived defaults with optional artist overrides:** rejected — overrides metastasize; the exception becomes the rule.
