# AI Name Suggestions (Archive Phase 2) — Design Spec

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Scope:** `src/ai/` (new name-suggestion capability + versioned prompt), `src/types/ai.ts` (a `NameSuggestion` type), and `src/ui/DesignateWorldModal.tsx` + its container in `App.tsx`. No physics, renderer, translation, store, or persistence changes.
**Builds on:** the Exploration Archive (Phase 1, `2026-06-13-named-world-archive-design.md` §13) and the AI explanation layer (ADR-003, CLAUDE.md §7).

---

## 1. Motivation

The Exploration Archive lets users name worlds, but naming from a blank field is a small friction at the exact "cataloging a discovery" moment. Phase 2 offers **optional AI-suggested common names** — evocative, pronounceable names each tied to a *computed* property of the world — that the user can pick and edit. It lowers the friction without ever letting the model touch a simulation value.

CLAUDE.md §7 explicitly permits the AI to "generate flavor text for UI: names, discovery narratives." Names are cosmetic; this feature stays squarely inside that allowance.

## 2. Goals

1. A **"Suggest names"** action in the Designate modal that returns **three** cosmetic name candidates, each with a one-sentence rationale grounded in a computed property.
2. **Pick-to-fill:** selecting a suggestion fills the modal's name input; the user may edit it before confirming. Nothing is saved until the user confirms (the Phase 1 flow is unchanged).
3. **Safety:** every suggested name passes the existing `validateCommonName` guard before it can be used; invalid candidates are dropped, never shown as selectable.
4. **Graceful absence:** when no AI client is configured (no `VITE_GOOGLE_AI_API_KEY`), the feature is simply absent — the modal works exactly as in Phase 1.
5. **Charter compliance:** the model never invents or alters a number; the name capability is a read-only consumer of computed state, like the narrator/educator/speculator.

### Non-goals

- Name history, "regenerate one", caching, or favorites.
- Auto-naming (a name is never applied without an explicit user pick + confirm).
- Changing the Phase 1 designate/save flow, the archive store, or persistence.
- Suggestions influencing any physics or render value.

## 3. Charter & architecture alignment

| Principle | How this serves it |
|---|---|
| AI is a read-only explainer (CLAUDE.md §7, ADR-003) | The namer builds context, calls the client, parses prose into cosmetic names. It writes nothing to physics. |
| Names are cosmetic (Phase 1, §7) | Suggestions feed the same `validateCommonName` → `designate` path; the hash designation is still the honest identity. |
| Provider-agnostic AI (TD-008) | Reuses the existing `NarrationClient` interface; no new provider work. |
| Trust boundary on model output | A pure `parseNameSuggestions` validates and filters everything the model returns. |

## 4. Existing patterns this mirrors

The AI layer already has three capabilities built identically (`src/ai/narrator.ts`, `educator.ts`, `speculator.ts`):

```
capability(client, state, habitability?)
  → buildPlanetaryContext(state, habitability)        // src/ai/context.ts
  → client.generate({ systemInstruction, userPrompt }) // versioned prompt
  → tag/parse the returned string
```

Prompts are versioned `src/ai/prompts/<name>.v1.ts` exporting a `*_SYSTEM_V1` constant and a `build*Prompt(contextJson)` function. The UI injects the client (`createGeminiClientFromEnv()` returns `NarrationClient | null`); when null, the feature is disabled (the `NarrationPanel` pattern).

Phase 2 adds a **fourth** capability of the same shape, with one difference: it returns a small structured list rather than a single prose blob.

## 5. Data model

`NameSuggestion` is a distinct shape from `AIContent` (which is single-text, tagged description/explanation/speculation). Add to `src/types/ai.ts`:

```ts
/** One AI-suggested cosmetic common name with its rationale. Never a simulation value. */
export interface NameSuggestion {
  /** A candidate common name; guaranteed to pass validateCommonName. */
  name: string;
  /** One sentence tying the name to a computed property (temperature, composition, HZ). */
  rationale: string;
}
```

`AIContentKind` is **not** extended — suggestions are not `AIContent`.

## 6. The name capability

### 6.1 Prompt — `src/ai/prompts/planetName.v1.ts`

`PLANET_NAME_SYSTEM_V1` instructs the model to:
- Act as a planetary scientist proposing **common names** for a newly catalogued world.
- Propose exactly **three** evocative, pronounceable names.
- Tie each name to **one computed property** present in the context (temperature, composition class, habitable-zone position, gravity) in a single-sentence rationale.
- **Never** invent, alter, or restate a numerical value as authoritative.
- Constrain names to ≤40 characters, letters/spaces/hyphens/apostrophes only (so they pass `validateCommonName`); no `EXO-` style strings.
- Output **exactly three lines**, each `Name — rationale`, no numbering, headers, or extra prose.

`buildPlanetNamePrompt(contextJson: string): string` wraps the serialized context (from `buildPlanetaryContext`) with the instruction to produce the three lines.

### 6.2 Parser — `parseNameSuggestions(raw: string): NameSuggestion[]` (pure, 100%-tested)

The trust boundary for model output:
- Split on newlines; for each non-empty line, split once on an em dash `—` (fallback: ` - ` hyphen-with-spaces) into `name` and `rationale`.
- Trim both. Run `name` through `validateCommonName`; if invalid, **drop the line**. If `rationale` is missing, keep the name with an empty rationale.
- Return at most the first three valid suggestions (may be fewer; may be empty if the model misbehaved).

Lives in `src/ai/namer.ts` (exported for testing).

### 6.3 Capability — `suggestPlanetNames(client, state, habitability?) → Promise<NameSuggestion[]>`

In `src/ai/namer.ts`: builds context, calls `client.generate({ systemInstruction: PLANET_NAME_SYSTEM_V1, userPrompt: buildPlanetNamePrompt(...) })`, returns `parseNameSuggestions(text)`. Exported through `src/ai/index.ts` alongside the existing capabilities. Signature matches the others (`client: NarrationClient`, `state: PlanetaryState`, optional `habitability`).

## 7. UI

### 7.1 `DesignateWorldModal` (presentational, extended)

New optional props (all additive; Phase 1 callers still type-check because suggestions default to empty and the request handler is optional):

```ts
suggestions?: readonly NameSuggestion[];          // default []
suggestStatus?: 'idle' | 'generating' | 'error';  // default 'idle'
onRequestSuggestions?: () => void;                 // omitted ⇒ no Suggest button
```

- When `onRequestSuggestions` is provided, render a **"Suggest names"** button beside the name field. While `suggestStatus === 'generating'`, it shows a loading label and is disabled.
- Suggestions render under a header **"PROVISIONAL DESIGNATIONS (SUGGESTED)"** — each row a clickable name + its rationale. Clicking a row sets the modal's own local `name` input state to that name, so the user can edit before confirming. (Picking is internal to the modal; the container is not involved — it only supplies the data and the request handler.)
- `suggestStatus === 'error'` shows a short, non-blocking note ("Couldn't fetch suggestions — type a name instead."). The field always remains usable.
- The modal owns no AI logic; it only renders props and calls handlers (keeps it pure and testable).

### 7.2 `DesignateModalContainer` (in `App.tsx`, owns the async)

- Holds an injectable `nameClient: NarrationClient | null` (default `createGeminiClientFromEnv()`), local `suggestions`/`suggestStatus` state.
- If `nameClient === null`, it passes no `onRequestSuggestions` (button hidden).
- `onRequestSuggestions` → set `generating`, call `suggestPlanetNames(nameClient, world, habitability)`, set results + `idle`, or `error` on rejection (never throws to the UI).
- The container reads the live world from the simulation store (already does, for the readouts). Picking a suggestion is handled inside the modal, so the container needs no pick handler.

## 8. Testing (CLAUDE.md §11)

| Target | Coverage | Cases |
|---|---|---|
| `parseNameSuggestions` | 100% | clean 3-line input; em-dash and hyphen separators; missing rationale; an over-long / `EXO-` / HTML name dropped; more-than-3 capped; empty/garbage → `[]` |
| `suggestPlanetNames` | ≥80% | a fake `NarrationClient` returns canned lines → parsed suggestions; client rejection propagates as a rejected promise (container maps to `error`) |
| `DesignateWorldModal` | interaction | Suggest button calls `onRequestSuggestions`; suggestion rows render and clicking one fills the name field (then Confirm fires `onConfirm` with that name); no Suggest button when `onRequestSuggestions` is absent; existing confirm/cancel/validation tests stay green |

AI prose is not asserted (non-deterministic). `src/ai/providers/**` remains coverage-excluded.

## 9. Implementation phases (one plan)

1. `NameSuggestion` type + `parseNameSuggestions` (TDD, pure).
2. `planetName.v1` prompt + `suggestPlanetNames` capability (+ index export, fake-client test).
3. `DesignateWorldModal` suggestion UI (TDD) + styles.
4. `DesignateModalContainer` wiring (injectable client) + App test; final verify; mark spec implemented.

Each step: `npm run test && npm run lint && npm run typecheck && npm run build` green.

## 10. Risks & mitigations

- **Model returns malformed output** → `parseNameSuggestions` is defensive; worst case is zero suggestions and the field stays usable.
- **Model emits an unsafe/cheeky name** → `validateCommonName` filters it before it can be picked; the user still confirms.
- **No API key** → feature absent; Phase 1 modal unchanged.
- **Latency** → a clear generating state on the button; the field is never blocked.

## 11. Out of scope (this spec)

- Phase 3 (public catalog / backend) — separate spec, needs its own ADR.
- Any change to the archive store, persistence, sharing, or the physics/render layers.
- New AI providers or changes to `NarrationClient`.
