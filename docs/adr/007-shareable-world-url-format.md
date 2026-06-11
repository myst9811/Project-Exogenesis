# ADR-007: Shareable World URL — Encode Inputs, Version, and Migrate Forward

**Status:** Accepted
**Date:** 2026-06-11

## Context

A shared URL must reproduce an identical world on any machine, now and years from now (CLAUDE.md §16 MVP scope). Two things make this tractable: the simulation is deterministic (ADR-004 — identical inputs yield identical state), and a world already has a stable identity (the `ConfigurationManifest` hash over schema version + canonical configuration). The open question (TD-002 open item) was whether shared worlds need *bitwise-identical recomputation* across browsers or tolerance-based equality — and how to keep old URLs valid as the schema evolves.

## Decision

**Encode the inputs, not the computed state.** The URL carries the validated `PlanetConfiguration` (the user's parameters), never the `PlanetaryState`. On load, the configuration is decoded, migrated to the current schema, validated, and *recomputed* through the engine. State is large, schema-coupled, and forgeable; inputs plus determinism reproduce it exactly and compactly.

**Token format:** base64url of the canonical JSON envelope `{ "v": <schemaVersion>, "c": <configuration> }`, using the same `canonicalizeForHashing` serialization as the manifest hash — so the token's canonical form and the world's identity hash agree. base64url (`-`/`_`, no padding) is URL-safe in a fragment without escaping.

**Versioned, with a migration layer from day one.** The schema version is embedded in the envelope. A migration registry keyed by *source* version chains old payloads forward to the current schema before validation. The registry is empty at v0.1.0 (nothing to migrate yet), but the chain runner ships and is tested now — so the first breaking schema change adds a migration entry, not a migration *mechanism*.

**Decode is a trust boundary.** A URL can come from anywhere. Decoding returns a typed result: `ok` with a validated configuration, or `ok: false` with `SimulationDiagnostic`s (malformed base64, invalid JSON, missing/unmigratable version, failed validation). Malformed input never throws into the UI (CLAUDE.md §19).

## Recomputation tolerance

The MVP relies on **value equality of the decoded configuration**, not bitwise-identical recomputed state. Because the same inputs run through the same deterministic engine, the recomputed state matches within floating-point reproducibility (ECMAScript mandates IEEE 754 binary64 arithmetic; see TD-002). Cross-browser transcendental-function differences could in principle perturb the *last bits* of a computed value, but the world's *identity* is the input hash, which is unaffected. Bitwise-identical recomputation is therefore not required and is not pursued; this resolves the TD-002 open question for the MVP.

## Consequences

**Easier:** tiny URLs; world identity and URL share one canonical form; old URLs stay loadable through the migration chain; decode failures degrade gracefully.

**Harder:** every breaking `PlanetaryState`/`PlanetConfiguration` schema change must ship a migration step and a test for it — a permanent obligation, accepted as the cost of durable share links.

## Alternatives Considered

- **Encode the computed `PlanetaryState`:** rejected — large, redundant (recomputable), schema-coupled, and forgeable (a URL could assert a physically impossible state the engine would never produce).
- **No version / no migration:** rejected — the schema *will* change (it is pre-1.0); unversioned URLs would silently break or misparse.
- **A server-side short-link service:** rejected for MVP — contradicts the no-backend single-page architecture (ARCHITECTURE.md §1); the deterministic input encoding needs no server.
