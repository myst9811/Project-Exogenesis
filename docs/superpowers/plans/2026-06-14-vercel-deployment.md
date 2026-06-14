# Vercel Deployment + Serverless AI Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the SPA to Vercel as a public demo with the Gemini key held server-side — AI works through a same-origin `/api/generate` proxy, the key never enters the client bundle.

**Architecture:** A Vercel Node serverless function (`api/generate.ts`) holds `GOOGLE_AI_API_KEY` and calls Gemini via the existing `@google/genai` SDK. A `createProxyClient` adapter implements the existing `NarrationClient` so the AI orchestration is unchanged; a `createNarrationClientFromEnv()` selector chooses direct (local key) → proxy (`VITE_AI_PROXY` flag) → none. `vercel.json`, a dedicated `tsconfig.api.json`, docs, and ADR-009 complete it.

**Tech Stack:** TypeScript (strict), Vite, Vercel serverless (Node), `@google/genai`, `@vercel/node` types, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-14-vercel-deployment-design.md`.

---

## File Structure

- **Create** `src/ai/providers/proxy.ts` + `src/ai/providers/proxy.test.ts` — `createProxyClient` (`NarrationClient` over `fetch`).
- **Create** `src/ai/providers/clientFromEnv.ts` + `src/ai/providers/clientFromEnv.test.ts` — `createNarrationClientFromEnv()` selector.
- **Modify** `src/ai/providers/gemini.ts` — remove `createGeminiClientFromEnv` (keep `createGeminiClient`).
- **Modify** `src/ai/index.ts` — export `createNarrationClientFromEnv`, `createProxyClient`.
- **Modify** `src/vite-env.d.ts` — add `VITE_AI_PROXY`.
- **Modify** `src/ui/NarrationPanel.tsx`, `src/ui/App.tsx` — use the selector.
- **Create** `api/generate.ts` — the serverless proxy function.
- **Create** `tsconfig.api.json` — Node-typed config for `api/`.
- **Modify** `package.json` — `@types/node` + `@vercel/node` dev deps; `typecheck`/`build` cover both tsconfigs.
- **Modify** `eslint.config.js` — override block for `api/**`.
- **Create** `vercel.json` — Vite preset + SPA rewrite.
- **Modify** `.env.example` — document the three env vars.
- **Create** `DEPLOYMENT.md`, `docs/adr/009-serverless-ai-proxy.md`.
- **Modify** the spec — mark implemented (final task).

Four tasks. Tasks 1–2 keep the suite green; Task 3 adds the function + tooling; Task 4 is config/docs + verification.

---

## Task 1: Proxy client adapter (TDD)

**Files:**
- Create: `src/ai/providers/proxy.ts`, `src/ai/providers/proxy.test.ts`

- [ ] **Step 1: Write the failing test** — `src/ai/providers/proxy.test.ts`:

```ts
/**
 * @module ai/providers/proxy.test
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProxyClient } from './proxy';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createProxyClient', () => {
  it('POSTs the request as JSON to the endpoint and returns the text', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ text: 'A blue world.' }), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createProxyClient('/api/generate');
    const result = await client.generate({ systemInstruction: 'sys', userPrompt: 'usr' });

    expect(result).toBe('A blue world.');
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/generate');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ systemInstruction: 'sys', userPrompt: 'usr' });
  });

  it('returns an empty string when the response has no text', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))));
    const client = createProxyClient();
    expect(await client.generate({ systemInstruction: 's', userPrompt: 'u' })).toBe('');
  });

  it('throws when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('nope', { status: 502 }))));
    const client = createProxyClient();
    await expect(client.generate({ systemInstruction: 's', userPrompt: 'u' })).rejects.toThrow(
      /502/,
    );
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/ai/providers/proxy.test.ts`
Expected: FAIL — `./proxy` not found.

- [ ] **Step 3: Implement** — `src/ai/providers/proxy.ts`:

```ts
/**
 * @module ai/providers/proxy
 *
 * A {@link NarrationClient} that calls a same-origin serverless proxy
 * (`/api/generate`) instead of the model API directly. The proxy holds the
 * API key server-side, so the deployed client never carries a secret
 * (TD-015). The narrator/educator/speculator/namer depend only on the
 * interface, so swapping in this adapter changes nothing upstream.
 */

import type { NarrationClient, NarrationRequest } from '../client';

/**
 * Creates a {@link NarrationClient} backed by the serverless proxy.
 *
 * @param endpoint - The proxy URL (default `/api/generate`)
 * @returns A narration client that POSTs to the proxy
 */
export function createProxyClient(endpoint = '/api/generate'): NarrationClient {
  return {
    generate: async (request: NarrationRequest): Promise<string> => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error(`Proxy request failed (${response.status})`);
      }
      const data = (await response.json()) as { text?: string };
      return data.text ?? '';
    },
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ai/providers/proxy.test.ts && npm run lint && npm run typecheck`
Expected: PASS; clean.

- [ ] **Step 5: Commit**

```bash
git add src/ai/providers/proxy.ts src/ai/providers/proxy.test.ts
git commit -m "feat(ai): proxy NarrationClient that calls the same-origin /api/generate"
```

---

## Task 2: Client selector + swap call sites (TDD)

**Files:**
- Create: `src/ai/providers/clientFromEnv.ts`, `src/ai/providers/clientFromEnv.test.ts`
- Modify: `src/ai/providers/gemini.ts`, `src/ai/index.ts`, `src/vite-env.d.ts`, `src/ui/NarrationPanel.tsx`, `src/ui/App.tsx`

- [ ] **Step 1: Add `VITE_AI_PROXY` to the env typing** — in `src/vite-env.d.ts`, extend `ImportMetaEnv`:

```ts
interface ImportMetaEnv {
  readonly VITE_GOOGLE_AI_API_KEY?: string;
  readonly VITE_AI_PROXY?: string;
}
```

- [ ] **Step 2: Write the failing selector test** — `src/ai/providers/clientFromEnv.test.ts`:

```ts
/**
 * @module ai/providers/clientFromEnv.test
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createNarrationClientFromEnv } from './clientFromEnv';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createNarrationClientFromEnv', () => {
  it('returns a direct client when a build-time key is set', () => {
    vi.stubEnv('VITE_GOOGLE_AI_API_KEY', 'test-key');
    expect(createNarrationClientFromEnv()).not.toBeNull();
  });

  it('returns a proxy client when no key but the proxy flag is on', () => {
    vi.stubEnv('VITE_GOOGLE_AI_API_KEY', '');
    vi.stubEnv('VITE_AI_PROXY', 'true');
    expect(createNarrationClientFromEnv()).not.toBeNull();
  });

  it('returns null when neither a key nor the proxy flag is set', () => {
    vi.stubEnv('VITE_GOOGLE_AI_API_KEY', '');
    vi.stubEnv('VITE_AI_PROXY', '');
    expect(createNarrationClientFromEnv()).toBeNull();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/ai/providers/clientFromEnv.test.ts`
Expected: FAIL — `./clientFromEnv` not found.

- [ ] **Step 4: Implement the selector** — `src/ai/providers/clientFromEnv.ts`:

```ts
/**
 * @module ai/providers/clientFromEnv
 *
 * Chooses the narration client for the current environment (TD-015):
 *   - a build-time key (`VITE_GOOGLE_AI_API_KEY`) → the direct Gemini client
 *     (local development);
 *   - else the `VITE_AI_PROXY` flag → the same-origin proxy client (the
 *     deployed build, where the key lives server-side);
 *   - else `null` → the UI hides AI features gracefully.
 *
 * This is the single place the UI asks "is AI available, and how do I reach
 * it?"; the orchestration layer is unaffected by the choice.
 */

import type { NarrationClient } from '../client';
import { createGeminiClient } from './gemini';
import { createProxyClient } from './proxy';

/**
 * Builds the narration client from the build-time environment, or returns
 * `null` when no AI is configured.
 *
 * @returns A narration client, or `null`
 */
export function createNarrationClientFromEnv(): NarrationClient | null {
  const directKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  if (directKey !== undefined && directKey !== '') {
    return createGeminiClient({ apiKey: directKey });
  }
  const proxyFlag = import.meta.env.VITE_AI_PROXY;
  if (proxyFlag === 'true' || proxyFlag === '1') {
    return createProxyClient();
  }
  return null;
}
```

- [ ] **Step 5: Remove the superseded factory** — in `src/ai/providers/gemini.ts`, delete the `createGeminiClientFromEnv` function (the whole `export function createGeminiClientFromEnv(): NarrationClient | null { … }` block and its doc comment). Keep `createGeminiClient`, `GeminiClientOptions`, and `DEFAULT_GEMINI_MODEL`. The file no longer reads `import.meta.env`.

- [ ] **Step 6: Export from the AI barrel** — in `src/ai/index.ts` add:

```ts
export { createProxyClient } from './providers/proxy';
export { createNarrationClientFromEnv } from './providers/clientFromEnv';
```

- [ ] **Step 7: Swap the call sites**

  In `src/ui/NarrationPanel.tsx`, replace the import line:

```ts
import { createNarrationClientFromEnv } from '../ai';
```

  and the default prop:

```ts
  client = createNarrationClientFromEnv(),
```

  In `src/ui/App.tsx`, replace the import line `import { createGeminiClientFromEnv } from '../ai/providers/gemini';` with adding `createNarrationClientFromEnv` to the existing `../ai` import (the file already imports `suggestPlanetNames`, `NameSuggestion`, `NarrationClient` from `../ai`), and change the `nameClient` initializer:

```ts
  const [nameClient] = useState<NarrationClient | null>(() => createNarrationClientFromEnv());
```

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run src/ai/providers/clientFromEnv.test.ts && npm run typecheck && npm run lint && npm run test 2>&1 | tail -3`
Expected: selector tests PASS; clean; full suite green (no key + no proxy flag in the test env ⇒ both call sites get `null`, AI hidden — unchanged behavior).

- [ ] **Step 9: Commit**

```bash
git add src/ai/providers/clientFromEnv.ts src/ai/providers/clientFromEnv.test.ts src/ai/providers/gemini.ts src/ai/index.ts src/vite-env.d.ts src/ui/NarrationPanel.tsx src/ui/App.tsx
git commit -m "feat(ai): createNarrationClientFromEnv selects direct/proxy/none; swap call sites"
```

---

## Task 3: Serverless proxy function + Node tooling

**Files:**
- Create: `api/generate.ts`, `tsconfig.api.json`
- Modify: `package.json`, `eslint.config.js`

> No unit test: `api/generate.ts` is an I/O boundary (server runtime + SDK), like `gemini.ts`. It is covered by `tsc -p tsconfig.api.json` and verified by a preview deploy. Its request-validation shape is simple and exercised end-to-end on the preview URL.

- [ ] **Step 1: Add the Node dev dependencies**

Run:
```bash
npm install -D @vercel/node @types/node
```
Expected: both added to `devDependencies`.

- [ ] **Step 2: Create the function** — `api/generate.ts`:

```ts
/**
 * Vercel serverless proxy for the AI narration layer (TD-015). Holds the
 * Gemini API key server-side (`GOOGLE_AI_API_KEY`, no VITE_ prefix, so it is
 * never bundled into the client) and forwards a system instruction + user
 * prompt to Gemini. The browser calls this same-origin endpoint instead of
 * Google directly, so the deployed client carries no secret.
 *
 * Hygiene guards only (POST-only, length cap); abuse cost is capped by the
 * Gemini free-tier quota. This is an I/O boundary, verified by deploy.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';
const MAX_PROMPT_CHARS = 8000;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    res.status(503).json({ error: 'AI is not configured.' });
    return;
  }
  const body = req.body as { systemInstruction?: unknown; userPrompt?: unknown };
  const systemInstruction = body.systemInstruction;
  const userPrompt = body.userPrompt;
  if (
    typeof systemInstruction !== 'string' ||
    typeof userPrompt !== 'string' ||
    userPrompt.length === 0 ||
    userPrompt.length > MAX_PROMPT_CHARS
  ) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }
  try {
    const genai = new GoogleGenAI({ apiKey });
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: { systemInstruction },
    });
    res.status(200).json({ text: response.text ?? '' });
  } catch {
    res.status(502).json({ error: 'Generation failed.' });
  }
}
```

- [ ] **Step 3: Create `tsconfig.api.json`** (Node-typed, no DOM):

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2023"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["api/**/*.ts"]
}
```

- [ ] **Step 4: Wire the scripts** — in `package.json`, update:

```json
    "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.api.json",
    "build": "tsc --noEmit && tsc --noEmit -p tsconfig.api.json && vite build",
```

- [ ] **Step 5: Add the eslint override for `api/`** — in `eslint.config.js`, add a block (after the `src/ui/**` block, before the test block):

```js
  // ── Vercel serverless functions (Node runtime) ──
  {
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: { process: 'readonly' },
    },
  },
```

> The config's `parserOptions.projectService: true` discovers `tsconfig.api.json` automatically for typed linting, so the override above only needs the `process` global. Fallback: if eslint reports `api/generate.ts` is "not found in any TS project", add `parserOptions: { project: ['./tsconfig.api.json'], tsconfigRootDir: import.meta.dirname }` to this `api/**` override block.

- [ ] **Step 6: Verify build + types + lint**

Run: `npm run typecheck && npm run lint && npm run build 2>&1 | tail -2`
Expected: both tsconfigs typecheck; lint clean; Vite build succeeds. (`api/` is outside Vite's `src` graph, so the bundle is unaffected and the key var is never referenced client-side.)

- [ ] **Step 7: Commit**

```bash
git add api/generate.ts tsconfig.api.json package.json package-lock.json eslint.config.js
git commit -m "feat(api): serverless Gemini proxy with Node tsconfig and lint scope"
```

---

## Task 4: Vercel config, env docs, ADR + verification

**Files:**
- Create: `vercel.json`, `DEPLOYMENT.md`, `docs/adr/009-serverless-ai-proxy.md`
- Modify: `.env.example`, the spec

- [ ] **Step 1: Create `vercel.json`**:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Update `.env.example`** — replace its body with all three vars and the local-vs-deploy split:

```bash
# Project Exogenesis — environment template
#
# LOCAL DEVELOPMENT (.env.local, gitignored): set the direct key. Vite inlines
# VITE_-prefixed vars at build time, so this key is visible client-side — fine
# for local dev only. Get a free key at https://aistudio.google.com/apikey.
VITE_GOOGLE_AI_API_KEY=

# DEPLOYMENT (set in the Vercel dashboard, NOT here):
#   GOOGLE_AI_API_KEY   — server secret for the /api/generate proxy. NO VITE_
#                         prefix, so it is never bundled into the client.
#   VITE_AI_PROXY=true  — makes the client call the proxy instead of Google.
# Never set VITE_GOOGLE_AI_API_KEY in Vercel (it would expose the key).
```

- [ ] **Step 3: Write `DEPLOYMENT.md`**:

```markdown
# Deployment (Vercel)

Project Exogenesis deploys to Vercel as a static Vite SPA plus one serverless
function that proxies AI requests so the Gemini key stays server-side.

## One-time setup

1. Push the repo to GitHub (done).
2. In the Vercel dashboard: **Add New → Project → Import** this GitHub repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output directory `dist` (from `vercel.json`).
4. **Environment Variables** (Project Settings → Environment Variables), for
   both **Production** and **Preview**:
   - `GOOGLE_AI_API_KEY` = your Google AI Studio key (server secret).
   - `VITE_AI_PROXY` = `true`.
   - Do **not** set `VITE_GOOGLE_AI_API_KEY` (that would bundle the key).
5. Deploy.

## How it works

- The browser calls `POST /api/generate`; `api/generate.ts` (Node function)
  reads `GOOGLE_AI_API_KEY` server-side and calls Gemini. The key is never in
  the client bundle.
- The client selector (`createNarrationClientFromEnv`) uses the proxy when
  `VITE_AI_PROXY=true` and no direct key is present.
- SPA deep links (`#w=…&n=…`) resolve via the `vercel.json` rewrite.

## Continuous deployment

- Push to `main` → production deploy.
- Open a PR → a preview deploy with its own URL.

## Verify the key is not exposed

On the deployed URL: open DevTools → Network, trigger an AI action (Describe /
Suggest names), and confirm the request goes to `/api/generate` on your own
origin — not to `googleapis.com` — and that the key appears nowhere in
`view-source` or the JS bundle.

## Local development

Copy `.env.example` to `.env.local`, set `VITE_GOOGLE_AI_API_KEY`, run
`npm run dev`. Locally the app uses the direct client (no proxy needed). With
no key, AI features are hidden.
```

- [ ] **Step 4: Write ADR-009** — `docs/adr/009-serverless-ai-proxy.md`:

```markdown
# ADR-009: Serverless AI proxy for public deployment

## Status
Accepted — implemented 2026-06-14.

## Context
The app is a static SPA; Vite inlines `VITE_`-prefixed env vars into the
client bundle. On a public deployment a `VITE_GOOGLE_AI_API_KEY` would be
extractable from page source, letting anyone spend the owner's Gemini quota.

## Decision
On deployment, route AI requests through a Vercel serverless function
(`api/generate.ts`) that holds `GOOGLE_AI_API_KEY` server-side. A
`createProxyClient` implements the existing `NarrationClient`, and
`createNarrationClientFromEnv` selects direct (local key) → proxy
(`VITE_AI_PROXY`) → none. The AI orchestration layer is unchanged.

## Rationale
The key never reaches a client. The `NarrationClient` seam means the proxy is
one adapter, not a change to prompts or orchestration. Local dev keeps the
simple direct path.

## Consequences
- Easier: a safe public demo with working AI; PR preview deploys.
- Harder: a second runtime (Node function) with its own tsconfig/lint scope.
- The proxy endpoint is public; abuse cost is bounded by the Gemini free-tier
  quota. Rate-limiting (Vercel KV / Upstash) is a documented future step.

## Alternatives considered
- Ship the `VITE_` key as-is — rejected: publicly extractable.
- Ship with AI disabled — rejected: loses a core feature on the demo.
```

- [ ] **Step 5: Full verification**

Run: `npm run typecheck && npm run lint && npm run test 2>&1 | tail -3 && npm run build 2>&1 | tail -2`
Expected: all green; build succeeds; `dist/` produced.

- [ ] **Step 6: Mark the spec implemented** — append to `docs/superpowers/specs/2026-06-14-vercel-deployment-design.md`:

```markdown

---

## Status: Implemented (2026-06-14)

Shipped: the `api/generate.ts` serverless proxy (key server-side), `createProxyClient`, the `createNarrationClientFromEnv` selector (direct/proxy/none) with both call sites swapped, `vercel.json` (Vite preset + SPA rewrite), `tsconfig.api.json` + lint scope for the Node function, `.env.example` docs, `DEPLOYMENT.md`, and ADR-009. The Gemini key is never bundled. The actual Vercel↔GitHub connection and env-var entry are performed in the Vercel dashboard per `DEPLOYMENT.md`. Rate limiting remains a documented future step.
```

- [ ] **Step 7: Commit**

```bash
git add vercel.json DEPLOYMENT.md docs/adr/009-serverless-ai-proxy.md .env.example docs/superpowers/specs/2026-06-14-vercel-deployment-design.md
git commit -m "feat: Vercel config, deployment docs, and ADR-009 for the serverless AI proxy"
```

- [ ] **Step 8: Deployment handoff (manual, by the owner)**

This plan produces all the code/config. The actual deploy is dashboard work (see `DEPLOYMENT.md`): connect the GitHub repo, set `GOOGLE_AI_API_KEY` + `VITE_AI_PROXY=true` for Production + Preview, deploy, then run the "Verify the key is not exposed" check on the preview URL. Report the preview result; if the proxy errors, check the function logs in the Vercel dashboard.

---

## Self-Review

**Spec coverage:** §2.1 Vercel deploy via GitHub → Task 4 (`vercel.json`, `DEPLOYMENT.md`). §2.2 key server-side → Task 3 (`api/generate.ts`, `GOOGLE_AI_API_KEY`). §2.3 AI via proxy → Tasks 1–3. §2.4 local unchanged → Task 2 selector (direct path) + Task 8 verification. §2.5 deep links → Task 4 rewrite. §2.6 orchestration untouched → Tasks 1–2 (interface-only). §3.1 function → Task 3. §3.2 proxy adapter → Task 1. §3.3 selector → Task 2. §3.4 vercel.json → Task 4. §3.5 ts/lint boundary → Task 3. §3.6 env vars → Tasks 2/3/4. §4 docs → Task 4. §5 testing → Tasks 1/2 (+ boundary exclusion noted). §6 verification → Tasks 2/3/4 + Task 8 manual. All covered.

**Placeholder scan:** No TBD/TODO. The eslint Step 5 note gives a concrete fallback (`project: ['tsconfig.json','tsconfig.api.json']`) rather than a vague "fix if broken". The "no unit test for `api/`" decision is explicit and justified (I/O boundary, like `gemini.ts`), covered by typecheck + preview deploy. The dashboard steps (Task 8) are inherently manual and flagged as the owner's action.

**Type consistency:** `createProxyClient(endpoint?)` → `NarrationClient` matches between Task 1 (def), the barrel (Task 2), and the selector (Task 2). `createNarrationClientFromEnv(): NarrationClient | null` matches between Task 2 (def) and both call sites (Task 2 Step 7). The request shape `{ systemInstruction: string, userPrompt: string }` is identical in `NarrationRequest` (existing), the proxy body (Task 1), and the function's validation (Task 3). `VITE_AI_PROXY` is declared in `vite-env.d.ts` (Task 2 Step 1) and read in the selector (Task 2 Step 4). `GOOGLE_AI_API_KEY` (server) vs `VITE_GOOGLE_AI_API_KEY` (client) are kept distinct across the function, selector, `.env.example`, and docs.
