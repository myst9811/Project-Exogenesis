# Vercel Deployment + Serverless AI Proxy — Design Spec

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Scope:** A new `api/generate.ts` serverless function, a `src/ai/providers/proxy.ts` client adapter, a `createNarrationClientFromEnv()` selector (replacing the two `createGeminiClientFromEnv()` call sites), `vercel.json`, a dedicated `tsconfig.api.json` + eslint override for `api/`, env-var docs, `DEPLOYMENT.md`, and ADR-009. No physics, renderer, translation, store, or AI-orchestration (narrator/educator/speculator/namer) changes.
**Goal:** Deploy Project Exogenesis as a public demo on Vercel with the Gemini API key held **server-side** (never bundled into the client), AI features working through a same-origin proxy.

---

## 1. Motivation & the core constraint

The app is a static SPA. Vite inlines any `VITE_`-prefixed env var into the client bundle, so `VITE_GOOGLE_AI_API_KEY` is **extractable from page source** on a public site — anyone could spend the owner's Gemini quota. Both `src/ai/providers/gemini.ts` and `.env.example` already document the intended fix: "a production deployment should route narration through a key-holding proxy."

This spec implements that: a tiny Vercel serverless function holds the key and calls Gemini; the browser calls `/api/generate` instead of Google directly. The key never reaches a client.

Audience: **public demo / portfolio**. Deploy method: **GitHub integration** (push to `main` → production; PRs → preview URLs). Abuse protection: **rely on Gemini's free-tier quota** as the cost cap, plus free stateless hygiene guards in the function (no KV/rate-limit store — explicit non-goal).

## 2. Goals

1. A public Vercel deployment of the Vite SPA, building from `main` via GitHub integration.
2. The Gemini key lives only in server env (`GOOGLE_AI_API_KEY`, **no** `VITE_` prefix); it is never in the client bundle.
3. AI narration + name suggestions work on the deployed site through `/api/generate`.
4. Local development is unchanged: a `VITE_GOOGLE_AI_API_KEY` still drives the direct client; absent → AI gracefully hidden.
5. Shared deep links (`#w=…&n=…`) resolve on any path (SPA fallback).
6. The AI orchestration layer (narrator/educator/speculator/namer) is untouched — only the client adapter and its selection change.

### Non-goals

- Rate-limiting infrastructure (Vercel KV / Upstash), analytics, error monitoring.
- A custom domain (the `*.vercel.app` URL is sufficient).
- Authentication, accounts, or per-user quotas.
- Streaming responses (the current client returns a single string; keep it).
- Changing the physics/render/store layers or the AI prompts.

## 3. Architecture

```
Browser (Vercel-hosted SPA)
  │  POST /api/generate { systemInstruction, userPrompt }
  ▼
api/generate.ts (Vercel Node function)   ← holds GOOGLE_AI_API_KEY (server secret)
  │  @google/genai → Gemini
  ▼
{ text }  ─────────────────────────────►  back to the browser
```

The browser never holds the key and never calls Google directly in the deployed build.

### 3.1 Serverless function — `api/generate.ts`

A Vercel Node serverless function (Vercel auto-detects files in `/api`).

- Reads `process.env.GOOGLE_AI_API_KEY`. If absent → `503 { error: 'AI is not configured.' }`.
- Accepts **POST** only; any other method → `405`.
- Parses `{ systemInstruction: string, userPrompt: string }` from the body. Validates both are strings; rejects when either is missing or when `userPrompt` exceeds a length cap (e.g. 8000 chars) → `400`. (Hygiene guard, not rate limiting.)
- Calls Gemini through `@google/genai` (the same SDK call `gemini.ts` already makes) with `DEFAULT_GEMINI_MODEL`.
- Returns `200 { text }`. On an SDK/network error → `502 { error: 'Generation failed.' }` (never leak internals or the key).
- Same-origin only; no permissive CORS headers (the browser and function share the Vercel origin).

Like `gemini.ts`, this is an I/O boundary (network + SDK + server runtime) — excluded from unit coverage, verified by a preview deploy.

### 3.2 Client adapter — `src/ai/providers/proxy.ts`

`createProxyClient(endpoint = '/api/generate'): NarrationClient`:

```ts
export function createProxyClient(endpoint = '/api/generate'): NarrationClient {
  return {
    generate: async (request) => {
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

It implements the existing `NarrationClient` interface, so narrator/educator/speculator/namer consume it unchanged. The `fetch`/network I/O is a boundary, but the **request shaping** (URL, method, JSON body, non-ok → throw) is pure enough to unit-test with a fake `fetch`.

### 3.3 Client selection — `createNarrationClientFromEnv()`

A new selector in **`src/ai/providers/clientFromEnv.ts`**, re-exported from the `src/ai/index.ts` barrel, that both UI call sites use instead of `createGeminiClientFromEnv()`:

```ts
export function createNarrationClientFromEnv(): NarrationClient | null {
  const directKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  if (directKey !== undefined && directKey !== '') {
    return createGeminiClient({ apiKey: directKey }); // local dev: direct
  }
  if (import.meta.env.VITE_AI_PROXY === 'true' || import.meta.env.VITE_AI_PROXY === '1') {
    return createProxyClient(); // deployed: same-origin proxy
  }
  return null; // AI gracefully absent
}
```

- **Local dev:** set `VITE_GOOGLE_AI_API_KEY` → direct client (today's behavior, unchanged).
- **Vercel:** set server `GOOGLE_AI_API_KEY` + build flag `VITE_AI_PROXY=true` → proxy client. The browser only ever sees the flag, never a key.
- **Neither:** `null` → the AI buttons/panel are hidden, exactly as now.

`createGeminiClientFromEnv()` is removed; `createGeminiClient` stays (used by the selector for the direct path) and `gemini.ts`'s direct-from-env logic folds into the selector. Add `VITE_AI_PROXY?: string` to `ImportMetaEnv` in `src/vite-env.d.ts`.

Call sites updated (mechanical swap, importing from the `../ai` barrel):
- `src/ui/NarrationPanel.tsx` — `client = createNarrationClientFromEnv()`.
- `src/ui/App.tsx` `DesignateModalContainer` — `createNarrationClientFromEnv()` for `nameClient`.

`src/ai/providers/clientFromEnv.ts` imports `createGeminiClient` (from `./gemini`) and `createProxyClient` (from `./proxy`); `src/ai/index.ts` re-exports `createNarrationClientFromEnv` and `createProxyClient`.

### 3.4 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

Vercel auto-detects the Vite framework and the `/api` function. The rewrite sends every non-`/api` path to `index.html` so deep links resolve to the SPA (the app reads the world from the URL fragment client-side). The function and its `@google/genai` dependency are bundled by Vercel from `package.json` (already a dependency).

### 3.5 TypeScript & lint boundary

The function targets Node, not the browser. The current single `tsconfig.json` includes only `src/**` + config files with the DOM lib, so `api/` would either be untyped or wrongly typed.

- Add **`tsconfig.api.json`**: `lib: ["ES2023"]` (no DOM), `types: ["node"]`, `include: ["api/**/*.ts"]`, `noEmit: true`, extends the strict options. Add `@types/node` as a dev dependency.
- Update scripts so the gate covers both:
  - `"typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.api.json"`
  - `"build": "tsc --noEmit && tsc --noEmit -p tsconfig.api.json && vite build"`
- Add an eslint override block for `api/**/*.ts`: Node environment, allows `process`/server globals; the existing architectural import bans (no physics/renderer/ui) still apply — the function imports only `@google/genai`.

### 3.6 Env vars

| Var | Where | Purpose |
|---|---|---|
| `VITE_GOOGLE_AI_API_KEY` | local `.env.local` only | Direct client for local dev (unchanged). **Never set in Vercel.** |
| `GOOGLE_AI_API_KEY` | Vercel project env (server) | The secret the proxy function uses. No `VITE_` prefix ⇒ not bundled. |
| `VITE_AI_PROXY` | Vercel project env (build) | `true` to make the client use the proxy. Bundled, but it's only a flag. |

`.env.example` updated to document all three and the local-vs-deploy split.

## 4. Documentation

- **`DEPLOYMENT.md`** — exact click-through: connect the GitHub repo in the Vercel dashboard, set `GOOGLE_AI_API_KEY` + `VITE_AI_PROXY=true` (production + preview scopes), confirm the Vite preset, first deploy, how to verify the key isn't in the bundle (`view-source` / network tab shows calls to `/api/generate`, not Google), and how PR preview URLs work.
- **ADR-009** — records the serverless-proxy-on-deploy decision: context (key exposure), decision (proxy holds the key; client selector chooses direct-vs-proxy-vs-none), consequences, alternatives (ship-disabled, ship-key-exposed) and why rejected.

## 5. Testing (CLAUDE.md §11)

| Target | Coverage | Cases |
|---|---|---|
| `createProxyClient` | request shaping | POSTs to the endpoint with JSON `{systemInstruction,userPrompt}`; returns `text` on ok; throws on non-ok status; returns `''` when `text` missing — all via an injected fake `fetch` |
| `createNarrationClientFromEnv` | selection logic | direct key set → a client; no key + `VITE_AI_PROXY=true` → a client; neither → `null` (stub `import.meta.env`) |
| `api/generate.ts` | excluded | I/O boundary (server runtime + SDK); verified by preview deploy |

Existing suites stay green: the UI call sites swap a factory but the injected-client test pattern is unchanged (tests pass their own fake clients). `src/ai/providers/**` remains coverage-excluded; the new pure bits live where they're testable or are explicitly boundary-excluded.

## 6. Verification

1. `npm run typecheck && npm run lint && npm run test && npm run build` green locally (both tsconfigs).
2. Open a PR → Vercel **preview deploy**; on the preview URL: AI narration + name suggestions work; `view-source` and the network tab show requests to `/api/generate` (same origin), and **no Gemini key** anywhere in the bundle or network calls to Google from the browser.
3. Merge to `main` → production deploy at the `*.vercel.app` URL; same checks.
4. Toggle: with `VITE_AI_PROXY` unset, confirm AI is gracefully hidden.

## 7. Risks & mitigations

- **Proxy abuse (public endpoint).** Accepted for a demo; Gemini's free-tier quota is the cost cap. Hygiene guards (POST-only, length caps) stop trivial misuse. Rate-limit KV is a documented future step, not now.
- **Key accidentally bundled.** Mitigated by the `GOOGLE_AI_API_KEY` (no `VITE_`) naming and the explicit verification step (inspect the bundle). `VITE_GOOGLE_AI_API_KEY` must never be set in Vercel.
- **`/api` typing drift.** The dedicated `tsconfig.api.json` + lint override keep it correct without weakening the app's DOM-typed strictness.
- **SPA deep links 404.** The catch-all rewrite to `/index.html` (excluding `/api`) handles it.

## 8. Out of scope (this spec)

- Rate limiting, analytics, monitoring, custom domain, auth.
- Streaming AI responses.
- Any change to physics/render/store/translation or the AI prompts/orchestration.
