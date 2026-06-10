# ADR-003: AI Never Influences Simulation Values

**Status:** Accepted
**Date:** 2026-06-10

## Context

The AI layer makes computed physics legible: narrating worlds, explaining mechanisms, and speculating (labeled) about implications. Large language models produce plausible-sounding numbers on request, which creates a standing temptation to let the model fill gaps in the simulation — name a plausible albedo, estimate a temperature, score habitability. Model output is not reproducible, not citable, and not physically grounded.

## Decision

The AI layer is read-only and downstream. It receives `PlanetaryState` as structured context and produces only typed text (`description` | `explanation` | `speculation`). It never generates simulation inputs, never produces scores or numeric values that enter the system, and never overrides physics outputs even if they appear wrong. Prompts are versioned artifacts in `src/ai/prompts/`. If AI-generated content contains a number that enters the simulation, that is a bug by definition.

## Rationale

- Determinism: identical inputs must yield identical worlds; LLM output is stochastic.
- Citability: every simulation value must trace to a published model, which an LLM cannot guarantee.
- Honesty: speculation is valuable when labeled and corrosive when laundered into data.

## Consequences

**Easier:** trusting every displayed number; swapping AI providers; testing (prompt construction is testable, generated text deliberately is not).

**Harder:** "AI magic" features (auto-generate an interesting world) must be reframed as deterministic input generation with AI narration on top.

## Alternatives Considered

- **AI-assisted parameter suggestion:** deferred — acceptable only as a UI convenience that emits ordinary *inputs* through the validation gateway, clearly attributed, never silently.
- **AI-computed habitability scoring:** rejected — habitability is a physics-engine output with documented models (ARCHITECTURE.md §3.4).
