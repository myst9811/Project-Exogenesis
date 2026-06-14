# AI Name Suggestions (Archive Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional "Suggest names" action to the Designate modal that asks the AI for three cosmetic common names (each tied to a computed property), validated and pick-to-fill, without the model ever touching a simulation value.

**Architecture:** A fourth AI capability mirroring narrator/educator/speculator — `suggestPlanetNames` + a versioned `planetName.v1` prompt — returns a new `NameSuggestion[]`. A pure, 100%-tested `parseNameSuggestions` is the trust boundary: it splits the model's `Name — rationale` lines and validates each name via the existing `validateCommonName`. `DesignateWorldModal` stays presentational (additive optional props; picking fills its own input); `DesignateModalContainer` owns the async with an injectable client and hides the feature when no API key is configured.

**Tech Stack:** TypeScript (strict), React, Vitest, the existing `NarrationClient` AI layer.

**Reference spec:** `docs/superpowers/specs/2026-06-14-ai-name-suggestions-design.md`.

---

## File Structure

- **Modify** `src/types/ai.ts` — add `NameSuggestion`.
- **Create** `src/ai/prompts/planetName.v1.ts` — versioned system prompt + `buildPlanetNamePrompt`.
- **Create** `src/ai/namer.ts` + `src/ai/namer.test.ts` — `parseNameSuggestions` (pure, 100%) and `suggestPlanetNames` (fake-client tested).
- **Modify** `src/ai/index.ts` — export `suggestPlanetNames`, `parseNameSuggestions`, and the `NameSuggestion` type.
- **Modify** `src/ui/DesignateWorldModal.tsx` + `src/ui/DesignateWorldModal.test.tsx` — suggestion UI (additive, presentational).
- **Modify** `src/index.css` — suggestion styles.
- **Modify** `src/ui/App.tsx` — wire the container's async + injectable client.
- **Modify** `docs/superpowers/specs/2026-06-14-ai-name-suggestions-design.md` — mark implemented (final task).

Four tasks; each ends green (`npm run test && npm run lint && npm run typecheck && npm run build`).

---

## Task 1: `NameSuggestion` type + `parseNameSuggestions` (TDD)

**Files:**
- Modify: `src/types/ai.ts`
- Create: `src/ai/namer.ts`, `src/ai/namer.test.ts`

- [ ] **Step 1: Add the type** — append to `src/types/ai.ts`:

```ts
/** One AI-suggested cosmetic common name with its rationale. Never a simulation value. */
export interface NameSuggestion {
  /** A candidate common name; guaranteed to pass validateCommonName. */
  name: string;
  /** One sentence tying the name to a computed property (temperature, composition, HZ). */
  rationale: string;
}
```

- [ ] **Step 2: Write the failing test** — `src/ai/namer.test.ts` (parser section only for now):

```ts
/**
 * @module ai/namer.test
 */

import { describe, expect, it } from 'vitest';

import { parseNameSuggestions } from './namer';

describe('parseNameSuggestions', () => {
  it('parses three "Name — rationale" lines', () => {
    const result = parseNameSuggestions(
      'Aurelia — its golden G-type sun\nVesper — a cool twilight world\nThalassa — an ocean-covered surface',
    );
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'Aurelia', rationale: 'its golden G-type sun' });
    expect(result[2]?.name).toBe('Thalassa');
  });

  it('accepts a hyphen separator with surrounding spaces', () => {
    const result = parseNameSuggestions('Boreas - a frozen polar world');
    expect(result[0]).toEqual({ name: 'Boreas', rationale: 'a frozen polar world' });
  });

  it('keeps a name with no rationale as an empty-rationale suggestion', () => {
    const result = parseNameSuggestions('Halcyon');
    expect(result[0]).toEqual({ name: 'Halcyon', rationale: '' });
  });

  it('drops candidates whose name fails validation (XSS, over-long, EXO- impersonation)', () => {
    const result = parseNameSuggestions(
      '<script> — bad\nEXO-A3F2B1 — impersonation\n' + 'x'.repeat(50) + ' — too long\nAurelia — ok',
    );
    expect(result).toEqual([{ name: 'Aurelia', rationale: 'ok' }]);
  });

  it('caps at three even if the model returns more', () => {
    const result = parseNameSuggestions('A — 1\nB — 2\nC — 3\nD — 4\nE — 5');
    expect(result).toHaveLength(3);
    expect(result.map((s) => s.name)).toEqual(['A', 'B', 'C']);
  });

  it('returns an empty array for empty or garbage input', () => {
    expect(parseNameSuggestions('')).toEqual([]);
    expect(parseNameSuggestions('   \n  \n')).toEqual([]);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/ai/namer.test.ts`
Expected: FAIL — `./namer` not found.

- [ ] **Step 4: Implement the parser** — `src/ai/namer.ts`:

```ts
/**
 * @module ai/namer
 *
 * Suggests cosmetic common names for a computed world (CLAUDE.md §7 — names
 * are permitted flavor text). Read-only: it builds context, asks the client,
 * and parses the prose into validated name candidates. `parseNameSuggestions`
 * is the trust boundary for model output — every name must pass the same
 * `validateCommonName` guard the user's own input does, so the model can never
 * introduce an unsafe or designation-impersonating string.
 */

import type { NameSuggestion } from '../types/ai';
import type { HabitabilityAssessment } from '../types/habitability';
import type { PlanetaryState } from '../types/physics';
import { validateCommonName } from '../store/archiveValidation';
import type { NarrationClient } from './client';
import { buildPlanetaryContext } from './context';
import { buildPlanetNamePrompt, PLANET_NAME_SYSTEM_V1 } from './prompts/planetName.v1';

const MAX_SUGGESTIONS = 3;

/**
 * Parses the model's reply into validated name suggestions. Each line is
 * `Name — rationale` (em dash) or `Name - rationale` (spaced hyphen). Names
 * that fail validation are dropped; the result is capped at three and may be
 * empty if the model misbehaved.
 *
 * @param raw - The raw model reply
 * @returns Up to three validated {@link NameSuggestion}s
 */
export function parseNameSuggestions(raw: string): NameSuggestion[] {
  const suggestions: NameSuggestion[] = [];
  for (const line of raw.split('\n')) {
    if (suggestions.length >= MAX_SUGGESTIONS) {
      break;
    }
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
      continue;
    }
    const separatorMatch = /\s[—–]\s|\s-\s/.exec(trimmedLine);
    const namePart = separatorMatch
      ? trimmedLine.slice(0, separatorMatch.index)
      : trimmedLine;
    const rationalePart = separatorMatch
      ? trimmedLine.slice(separatorMatch.index + separatorMatch[0].length)
      : '';
    const validation = validateCommonName(namePart);
    if (!validation.ok) {
      continue;
    }
    suggestions.push({ name: validation.value, rationale: rationalePart.trim() });
  }
  return suggestions;
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/ai/namer.test.ts && npm run lint && npm run typecheck`
Expected: PASS; clean. (`namer.ts` importing from `store/archiveValidation` is allowed — `ai/` may import the pure validator; it imports no physics calc modules.)

- [ ] **Step 6: Commit**

```bash
git add src/types/ai.ts src/ai/namer.ts src/ai/namer.test.ts
git commit -m "feat(ai): NameSuggestion type and parseNameSuggestions trust-boundary parser"
```

---

## Task 2: `planetName.v1` prompt + `suggestPlanetNames` capability (TDD)

**Files:**
- Create: `src/ai/prompts/planetName.v1.ts`
- Modify: `src/ai/namer.ts`, `src/ai/namer.test.ts`, `src/ai/index.ts`

- [ ] **Step 1: Create the prompt** — `src/ai/prompts/planetName.v1.ts`:

```ts
/**
 * @module ai/prompts/planetName.v1
 *
 * Versioned prompt for the namer: three cosmetic common-name suggestions for a
 * computed world (CLAUDE.md §7). The system instruction forbids the model from
 * generating or restating numbers as authoritative — names are flavor text,
 * each tied to a computed property by a one-sentence rationale.
 */

export const PLANET_NAME_SYSTEM_V1 = `You are a planetary scientist proposing common names for a newly catalogued exoplanet.

The physics simulation engine has already computed every parameter of this world. Your role is to name — never to compute.

Rules:
- Propose exactly THREE evocative, pronounceable common names.
- Tie each name to ONE computed property from the context (surface temperature, composition, habitable-zone position, or gravity) in a single short rationale.
- Do NOT generate, invent, or restate any numerical value as authoritative.
- Each name must be 1–40 characters, using only letters, spaces, hyphens, and apostrophes. Do not produce codes like "EXO-1234".
- Output EXACTLY three lines, each formatted "Name — rationale". No numbering, no headings, no extra prose.`;

/**
 * Builds the user prompt for name suggestions from the serialized context.
 *
 * @param contextJson - The structured physics context (see ai/context)
 * @returns The user-turn prompt
 */
export function buildPlanetNamePrompt(contextJson: string): string {
  return `The following parameters were computed by the physics engine:

${contextJson}

Propose three common names for this world, one per line as "Name — rationale".`;
}
```

- [ ] **Step 2: Add the failing capability test** — append to `src/ai/namer.test.ts`:

```ts
// add to the imports at the top of namer.test.ts:
import { vi } from 'vitest';
import { hashConfiguration } from '../physics/configuration/manifest';
import { computePlanetaryState } from '../physics';
import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import type { NarrationClient, NarrationRequest } from './client';
import { suggestPlanetNames } from './namer';

describe('suggestPlanetNames', () => {
  it('sends the name system instruction and returns parsed suggestions', async () => {
    const generate = vi.fn((_request: NarrationRequest) =>
      Promise.resolve('Aurelia — golden sun\nVesper — cool twilight\nThalassa — ocean world'),
    );
    const client: NarrationClient = { generate };
    const manifest = await hashConfiguration(createEarthBaselineConfiguration());
    const state = computePlanetaryState(manifest);

    const suggestions = await suggestPlanetNames(client, state);

    expect(suggestions.map((s) => s.name)).toEqual(['Aurelia', 'Vesper', 'Thalassa']);
    const request = generate.mock.calls[0]?.[0];
    expect(request?.systemInstruction).toContain('proposing common names');
    expect(request?.userPrompt).toContain('surfaceTemperatureKelvin');
  });

  it('propagates a client rejection', async () => {
    const client: NarrationClient = { generate: () => Promise.reject(new Error('rate limit')) };
    const manifest = await hashConfiguration(createEarthBaselineConfiguration());
    const state = computePlanetaryState(manifest);
    await expect(suggestPlanetNames(client, state)).rejects.toThrow('rate limit');
  });
});
```

> `describe`/`expect`/`it` are already imported at the top of `namer.test.ts` from Task 1; add only the new imports shown (`vi`, the physics helpers, the client types, and `suggestPlanetNames`). Consolidate the `vitest` import into one line.

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/ai/namer.test.ts`
Expected: FAIL — `suggestPlanetNames` not exported.

- [ ] **Step 4: Implement the capability** — append to `src/ai/namer.ts`:

```ts
/**
 * Asks the client for three cosmetic name suggestions for a computed world.
 *
 * @param client - The narration client (provider adapter or fake)
 * @param state - The computed planetary state
 * @param habitability - Optional habitability assessment for richer context
 * @returns Up to three validated {@link NameSuggestion}s
 */
export async function suggestPlanetNames(
  client: NarrationClient,
  state: PlanetaryState,
  habitability?: HabitabilityAssessment,
): Promise<NameSuggestion[]> {
  const text = await client.generate({
    systemInstruction: PLANET_NAME_SYSTEM_V1,
    userPrompt: buildPlanetNamePrompt(buildPlanetaryContext(state, habitability)),
  });
  return parseNameSuggestions(text);
}
```

- [ ] **Step 5: Export from the AI barrel** — in `src/ai/index.ts` add:

```ts
export { parseNameSuggestions, suggestPlanetNames } from './namer';
export type { NameSuggestion } from '../types/ai';
```

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run src/ai/namer.test.ts && npm run lint && npm run typecheck`
Expected: PASS; clean.

- [ ] **Step 7: Commit**

```bash
git add src/ai/prompts/planetName.v1.ts src/ai/namer.ts src/ai/namer.test.ts src/ai/index.ts
git commit -m "feat(ai): suggestPlanetNames capability with versioned planetName.v1 prompt"
```

---

## Task 3: Suggestion UI in `DesignateWorldModal` (TDD)

**Files:**
- Modify: `src/ui/DesignateWorldModal.tsx`, `src/ui/DesignateWorldModal.test.tsx`, `src/index.css`

- [ ] **Step 1: Add the failing tests** — append to `src/ui/DesignateWorldModal.test.tsx` (inside the existing `describe`); add `NameSuggestion` import at the top:

```ts
// add at top of DesignateWorldModal.test.tsx:
import type { NameSuggestion } from '../types/ai';

const suggestions: NameSuggestion[] = [
  { name: 'Aurelia', rationale: 'its golden sun' },
  { name: 'Vesper', rationale: 'a cool twilight' },
];
```

```tsx
  it('requests suggestions when the Suggest button is clicked', () => {
    const onRequestSuggestions = vi.fn();
    render(
      <DesignateWorldModal
        designation="EXO-A3F2B1"
        readouts={readouts}
        initialName=""
        diagnostics={[]}
        suggestions={[]}
        suggestStatus="idle"
        onRequestSuggestions={onRequestSuggestions}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /suggest names/i }));
    expect(onRequestSuggestions).toHaveBeenCalled();
  });

  it('fills the name field when a suggestion is picked, then confirms with it', () => {
    const onConfirm = vi.fn();
    render(
      <DesignateWorldModal
        designation="EXO-A3F2B1"
        readouts={readouts}
        initialName=""
        diagnostics={[]}
        suggestions={suggestions}
        suggestStatus="idle"
        onRequestSuggestions={vi.fn()}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Aurelia/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Designate' }));
    expect(onConfirm).toHaveBeenCalledWith('Aurelia');
  });

  it('omits the Suggest button when no request handler is given', () => {
    render(
      <DesignateWorldModal
        designation="EXO-A3F2B1"
        readouts={readouts}
        initialName=""
        diagnostics={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /suggest names/i })).toBeNull();
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ui/DesignateWorldModal.test.tsx`
Expected: FAIL — props/Suggest button absent.

- [ ] **Step 3: Extend the modal** — rewrite `src/ui/DesignateWorldModal.tsx`:

```tsx
/**
 * @module ui/DesignateWorldModal
 *
 * Modal for naming ("designating") the current world. Shows the immutable
 * designation and a few readouts so the user confirms which world they are
 * naming, then captures a cosmetic common name. Optionally offers AI name
 * suggestions: picking one fills the input (the user may still edit). Pure
 * presentational — it owns only the input text and calls handlers; the AI
 * async and validation diagnostics come from the parent (CLAUDE.md §4).
 */

import { useState } from 'react';
import type { JSX } from 'react';

import type { NameSuggestion } from '../types/ai';
import type { SimulationDiagnostic } from '../types/configuration';

export interface DesignateReadouts {
  surfaceTemperatureKelvin: number;
  surfaceGravityEarthG: number;
  hzLabel: string;
}

export function DesignateWorldModal({
  designation,
  readouts,
  initialName,
  diagnostics,
  suggestions = [],
  suggestStatus = 'idle',
  onRequestSuggestions,
  onConfirm,
  onCancel,
}: {
  designation: string;
  readouts: DesignateReadouts;
  initialName: string;
  diagnostics: readonly SimulationDiagnostic[];
  suggestions?: readonly NameSuggestion[];
  suggestStatus?: 'idle' | 'generating' | 'error';
  onRequestSuggestions?: () => void;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}): JSX.Element {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal designate-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Designate world"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <p className="modal-eyebrow">SUBSYSTEM 09 · EXPLORATION LOG</p>
        <h2 className="modal-title">Designate World</h2>
        <p className="designate-designation">{designation}</p>
        <div className="designate-readouts">
          <span>{Math.round(readouts.surfaceTemperatureKelvin)} K</span>
          <span>{readouts.surfaceGravityEarthG.toFixed(2)} g</span>
          <span>{readouts.hzLabel}</span>
        </div>
        <label className="designate-field">
          <span>Common name</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Aurelia"
            maxLength={40}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </label>

        {onRequestSuggestions !== undefined && (
          <div className="designate-suggest">
            <button
              type="button"
              className="tactical-btn"
              disabled={suggestStatus === 'generating'}
              onClick={onRequestSuggestions}
            >
              {suggestStatus === 'generating' ? 'Suggesting…' : '✦ Suggest names'}
            </button>
            {suggestStatus === 'error' && (
              <p className="designate-suggest__error">
                Couldn&rsquo;t fetch suggestions — type a name instead.
              </p>
            )}
            {suggestions.length > 0 && (
              <>
                <p className="designate-suggest__header">PROVISIONAL DESIGNATIONS (SUGGESTED)</p>
                <ul className="designate-suggest__list">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.name}>
                      <button
                        type="button"
                        className="designate-suggest__item"
                        onClick={() => {
                          setName(suggestion.name);
                        }}
                      >
                        <span className="designate-suggest__name">{suggestion.name}</span>
                        {suggestion.rationale.length > 0 && (
                          <span className="designate-suggest__rationale">{suggestion.rationale}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {diagnostics.map((diagnostic) => (
          <p key={diagnostic.parameter + diagnostic.message} className="designate-error" role="alert">
            {diagnostic.message}
          </p>
        ))}
        <div className="modal-actions">
          <button type="button" className="tactical-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="tactical-btn accent"
            disabled={trimmed.length === 0}
            onClick={() => {
              onConfirm(trimmed);
            }}
          >
            Designate
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/DesignateWorldModal.test.tsx`
Expected: PASS (new three + the existing confirm/cancel/disabled/diagnostic tests).

- [ ] **Step 5: Add styles** — append to `src/index.css`:

```css
/* ── Designate: AI name suggestions ── */
.designate-suggest {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.8rem;
}
.designate-suggest__header {
  font-family: var(--font-data);
  font-size: var(--text-micro);
  letter-spacing: var(--tracking-tactical);
  color: var(--text-secondary);
  margin: 0.4rem 0 0;
}
.designate-suggest__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.designate-suggest__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  width: 100%;
  text-align: left;
  background: var(--void-raised);
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  color: var(--text-primary);
}
.designate-suggest__item:hover {
  border-color: var(--border-active);
}
.designate-suggest__name {
  font-family: var(--font-display);
  color: var(--cyan-bright);
  letter-spacing: var(--tracking-data);
}
.designate-suggest__rationale {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}
.designate-suggest__error {
  color: var(--status-caution);
  font-size: var(--text-caption);
  margin: 0;
}
```

- [ ] **Step 6: Verify + commit**

Run: `npm run typecheck && npm run lint && npx vitest run src/ui/DesignateWorldModal.test.tsx`
Expected: clean; PASS.

```bash
git add src/ui/DesignateWorldModal.tsx src/ui/DesignateWorldModal.test.tsx src/index.css
git commit -m "feat(ui): AI name-suggestion UI in the Designate modal (pick-to-fill)"
```

---

## Task 4: Wire the container + final verification

**Files:**
- Modify: `src/ui/App.tsx`
- Modify: `docs/superpowers/specs/2026-06-14-ai-name-suggestions-design.md`

> The container's async is thin glue over the unit-tested `suggestPlanetNames`; it is verified by build + the manual gate (the existing `DesignateModalContainer` has no unit test, consistent with App's other inline containers). No App test is added — `createGeminiClientFromEnv()` returns null without a key, so the feature is simply absent in tests, leaving every existing App test green.

- [ ] **Step 1: Wire `DesignateModalContainer`** — in `src/ui/App.tsx`:

(a) Add imports:

```tsx
import { suggestPlanetNames } from '../ai';
import type { NameSuggestion } from '../ai';
import { createGeminiClientFromEnv } from '../ai/providers/gemini';
import type { NarrationClient } from '../ai';
```

> `NarrationClient` is exported from `../ai` (the barrel re-exports it). If the barrel does not re-export `NarrationClient`, import it from `../ai/client` instead.

(b) Replace the `DesignateModalContainer` function body with a version that owns suggestion state and a (lazily created) client:

```tsx
function DesignateModalContainer({
  stores,
  diagnostics,
  onConfirm,
  onCancel,
}: {
  stores: AppStores;
  diagnostics: readonly SimulationDiagnostic[];
  onConfirm: (name: string) => void;
  onCancel: () => void;
}): JSX.Element | null {
  const sim = useStore(stores.simulation);
  const archive = useStore(stores.archive);
  const [nameClient] = useState<NarrationClient | null>(() => createGeminiClientFromEnv());
  const [suggestions, setSuggestions] = useState<readonly NameSuggestion[]>([]);
  const [suggestStatus, setSuggestStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const world = sim.planetaryState;
  if (world === null) {
    return null;
  }
  const designation = `EXO-${world.configurationHash.slice(0, 6).toUpperCase()}`;
  const hzLabel =
    world.habitableZone === null ? 'OUT OF RANGE' : world.habitableZone.position.toUpperCase();
  const requestSuggestions =
    nameClient === null
      ? undefined
      : (): void => {
          setSuggestStatus('generating');
          void suggestPlanetNames(nameClient, world, sim.habitability ?? undefined)
            .then((result) => {
              setSuggestions(result);
              setSuggestStatus('idle');
            })
            .catch(() => {
              setSuggestStatus('error');
            });
        };
  return (
    <DesignateWorldModal
      designation={designation}
      readouts={{
        surfaceTemperatureKelvin: world.climate.surfaceTemperatureKelvin,
        surfaceGravityEarthG: world.bulk.surfaceGravityMetersPerSecondSquared / EARTH_SURFACE_GRAVITY,
        hzLabel,
      }}
      initialName={archive.entries[world.configurationHash]?.commonName ?? ''}
      diagnostics={diagnostics}
      suggestions={suggestions}
      suggestStatus={suggestStatus}
      {...(requestSuggestions !== undefined ? { onRequestSuggestions: requestSuggestions } : {})}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
```

> `useState` is already imported in `App.tsx`. The `{...(cond ? {prop} : {})}` spread avoids passing `onRequestSuggestions: undefined` under `exactOptionalPropertyTypes`. `sim.habitability` is `HabitabilityAssessment | null`; `?? undefined` matches the optional parameter.

- [ ] **Step 2: Verify the full suite + build**

Run: `npm run typecheck && npm run lint && npm run test 2>&1 | tail -3 && npm run build 2>&1 | tail -2`
Expected: all green (existing App tests unaffected — no key in test env ⇒ no Suggest button); build succeeds.

- [ ] **Step 3: Manual visual check (VISUAL GATE)**

Run with a key configured (`VITE_GOOGLE_AI_API_KEY` in `.env.local`): `npm run dev`. Open Designate; click **✦ Suggest names**; confirm a loading label, then three name rows each with a rationale; click one and confirm it fills the field; edit and Designate; confirm the world is archived under the chosen name. Without a key, confirm the Suggest button is absent and the modal behaves exactly as before. Report.

- [ ] **Step 4: Mark the spec implemented** — append to `docs/superpowers/specs/2026-06-14-ai-name-suggestions-design.md`:

```markdown

---

## Status: Implemented (2026-06-14)

Shipped: the `NameSuggestion` type, the pure `parseNameSuggestions` trust-boundary parser (100%), the `suggestPlanetNames` capability with the versioned `planetName.v1` prompt, and the pick-to-fill suggestion UI in the Designate modal (hidden when no AI key). Names are cosmetic and pass `validateCommonName` before use; nothing saves without an explicit pick + confirm. No physics/render/store/persistence changes. Phase 3 (public catalog) remains a separate, later spec.
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/App.tsx docs/superpowers/specs/2026-06-14-ai-name-suggestions-design.md
git commit -m "feat(ui): wire AI name suggestions into the Designate modal; mark Phase 2 implemented"
```

---

## Self-Review

**Spec coverage:** §2.1 Suggest action → Tasks 2/3/4. §2.2 pick-to-fill → Task 3 (internal `setName`). §2.3 safety/validation → Task 1 (`parseNameSuggestions` → `validateCommonName`). §2.4 graceful absence → Task 3 (no button without handler) + Task 4 (null client). §2.5 charter → Task 2 prompt rules + Task 1 validation. §5 type → Task 1. §6.1 prompt → Task 2. §6.2 parser → Task 1. §6.3 capability → Task 2. §7.1 modal props → Task 3. §7.2 container → Task 4. §8 testing → Tasks 1/2/3. §9 phases → Tasks 1–4. All covered.

**Placeholder scan:** No TBD/TODO; every code step is complete. The "no App test" note in Task 4 is an explicit, justified decision (thin glue; feature absent without a key) — not a hidden gap; the behavior is covered by the namer + modal tests and the manual gate. The single conditional import note (`NarrationClient` barrel vs `./client`) gives the engineer the exact fallback.

**Type consistency:** `NameSuggestion` (`{name, rationale}`) defined in Task 1, consumed identically in Tasks 2/3/4. `parseNameSuggestions(raw): NameSuggestion[]` and `suggestPlanetNames(client, state, habitability?): Promise<NameSuggestion[]>` match between definition (Tasks 1/2), barrel export (Task 2), and call site (Task 4). Modal props (`suggestions?`, `suggestStatus?`, `onRequestSuggestions?`) match between Task 3 (definition) and Task 4 (call site). `suggestStatus` union (`'idle'|'generating'|'error'`) is identical in the modal, its tests, and the container. The prompt exports (`PLANET_NAME_SYSTEM_V1`, `buildPlanetNamePrompt`) match between Task 2's prompt file and `namer.ts`.
