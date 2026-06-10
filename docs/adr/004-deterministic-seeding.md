# ADR-004: Deterministic Seeding — No Unseeded Randomness Anywhere

**Status:** Accepted
**Date:** 2026-06-10

## Context

Shareable world URLs are an MVP requirement: a URL must reproduce an identical world on any machine, today or years from now. Procedural elements (terrain noise, starfields) typically reach for `Math.random()`, which is unseedable and irreproducible. One unseeded call anywhere in the pipeline silently breaks world identity.

## Decision

Given identical inputs, the simulation produces identical outputs — always. `Math.random()` is banned project-wide and enforced by a custom ESLint rule (error, not warning). All procedural variation derives from explicit, documented seeds carried in the configuration. World identity is the SHA-256 hash of the schema version plus a canonicalized (key-order-independent) serialization of the validated configuration, pinned by a regression test on the Earth baseline.

Arithmetic determinism relies on ECMAScript's mandated IEEE 754 binary64 semantics. Implementation-defined transcendental functions (`Math.exp`, `Math.sin`, …) are the known residual risk: physics code prefers algebraic forms, and if cross-browser bitwise identity is ever required, deterministic software implementations will be introduced for those functions only (TECHNICAL_DECISIONS.md TD-002).

## Rationale

- Reproducibility is a scientific norm, not a feature: the same configuration *is* the same world.
- Deterministic systems are testable with exact regression anchors instead of statistical assertions.
- A content hash as world identity makes caching, sharing, and report signing (ARCHITECTURE.md §3.6) trivial.

## Consequences

**Easier:** debugging (every run reproducible), shareable URLs, report idempotency, cross-machine verification.

**Harder:** "surprise me" features need explicit seed generation at the UI boundary; contributors must learn the seeded-noise idiom.

## Alternatives Considered

- **Fixed-point arithmetic for bitwise cross-platform identity** (ARCHITECTURE.md §3.2): rejected for MVP — ECMAScript already mandates binary64 arithmetic; fixed point adds enormous complexity across the ~30 orders of magnitude physics spans.
- **Storing computed state in URLs instead of inputs:** rejected — state is large, schema-coupled, and forgeable; inputs plus determinism reproduce it exactly.
