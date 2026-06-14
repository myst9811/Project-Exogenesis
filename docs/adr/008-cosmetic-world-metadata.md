# ADR-008: Cosmetic world metadata (the Exploration Archive)

## Status

Accepted — implemented in Phase 1 (2026-06-14).

## Context

Users can create and share worlds (ADR-007) but cannot name or save them.
We want ownership and recognition — a personal catalog of discovered worlds —
without compromising the physics-first hierarchy (CLAUDE.md §2/§4/§7), and
without a backend (the MVP is a static SPA).

## Decision

Introduce a fourth, UI-only state layer — the **Exploration Archive** — holding
`WorldArchiveEntry` records keyed by the computed `configurationHash`. Names and
catalog snapshots are cosmetic: they never enter `PlanetConfiguration`,
`PlanetaryState`, or any physics calculation. The archive is persisted to
`localStorage` through an injectable adapter and hydrated at store creation.

Loading a saved world reuses the ADR-007 token path (`loadConfigurationToken`);
the archive never feeds configuration into the engine directly. Display names
travel in a separate `n` URL-fragment parameter parsed only by `worldUrl.ts`,
never inside the physics `{v,c}` envelope. A shared name a recipient has not
saved is shown session-only (the `ui` store's `sessionDisplayName`), never
auto-written to their archive.

## Rationale

The computed hash remains the world's honest, unique identity; the common name
is explicitly labeled and always shown beside `EXO-{hash}`. Keeping metadata in
a parallel layer means the physics engine stays the sole source of truth and the
archive is fully separable and testable. `localStorage` keeps it local-first
with no account.

## Consequences

- **Easier:** persistence across sessions, sharing with human context, and a
  future opt-in public catalog (Phase 3).
- **Harder:** nothing in physics. The archive adds a store, a persistence
  boundary (corrupt-data and quota handling), and name validation (XSS /
  designation-impersonation guards).
- Capacity is bounded: soft-warn at 180 entries, hard cap at 200 requiring a
  manual delete — a named world is never silently evicted.

## Alternatives considered

- **Embedding names in the physics token** — rejected: pollutes the
  deterministic identity and the decode trust boundary.
- **Silent LRU eviction at capacity** — rejected: would delete a world the user
  deliberately named without consent.
- **Server accounts / cloud sync** — deferred to Phase 3 (conflicts with the
  no-backend MVP; needs its own ADR).
