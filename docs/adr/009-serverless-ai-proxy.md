# ADR-009: Serverless AI proxy for public deployment

## Status

Accepted — implemented 2026-06-14.

## Context

The app is a static SPA; Vite inlines `VITE_`-prefixed env vars into the client
bundle. On a public deployment a `VITE_GOOGLE_AI_API_KEY` would be extractable
from page source, letting anyone spend the owner's Gemini quota.

## Decision

On deployment, route AI requests through a Vercel serverless function
(`api/generate.ts`) that holds `GOOGLE_AI_API_KEY` server-side. A
`createProxyClient` implements the existing `NarrationClient`, and
`createNarrationClientFromEnv` selects direct (local key) → proxy
(`VITE_AI_PROXY`) → none. The AI orchestration layer (narrator/educator/
speculator/namer) is unchanged. The Node function has its own
`api/tsconfig.json` (Node types) and an eslint scope, keeping the app's
browser-typed strict build intact.

## Rationale

The key never reaches a client. The `NarrationClient` seam means the proxy is
one adapter, not a change to prompts or orchestration. Local development keeps
the simple direct path.

## Consequences

- Easier: a safe public demo with working AI; PR preview deploys.
- Harder: a second runtime (Node function) with its own tsconfig/lint scope.
- The proxy endpoint is public; abuse cost is bounded by the Gemini free-tier
  quota plus hygiene guards (POST-only, prompt-length cap). Rate limiting
  (Vercel KV / Upstash) is a documented future step.

## Alternatives considered

- Ship the `VITE_` key as-is — rejected: publicly extractable.
- Ship with AI disabled — rejected: loses a core feature on the demo.
