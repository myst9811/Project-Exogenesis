# Deployment (Vercel)

Project Exogenesis deploys to Vercel as a static Vite SPA plus one serverless
function that proxies AI requests so the Gemini API key stays server-side.

## One-time setup

1. Push the repo to GitHub (done).
2. In the Vercel dashboard: **Add New → Project → Import** this GitHub repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build` and
   output directory `dist` come from `vercel.json`.
4. **Environment Variables** (Project Settings → Environment Variables), set for
   both **Production** and **Preview**:
   - `GOOGLE_AI_API_KEY` = your Google AI Studio key (server secret).
   - `VITE_AI_PROXY` = `true`.
   - Do **not** set `VITE_GOOGLE_AI_API_KEY` (that would bundle the key into the
     client).
5. Deploy.

## How it works

- The browser calls `POST /api/generate`; `api/generate.ts` (a Vercel Node
  function) reads `GOOGLE_AI_API_KEY` server-side and calls Gemini. The key is
  never in the client bundle.
- The client selector (`createNarrationClientFromEnv`) uses the proxy when
  `VITE_AI_PROXY=true` and no direct key is present.
- SPA deep links (`#w=…&n=…`) resolve via the `vercel.json` rewrite (everything
  except `/api/*` serves `index.html`).
- The Node function is typed by `api/tsconfig.json` (Node types, no DOM), kept
  separate from the app's browser-typed `tsconfig.json`.

## Continuous deployment

- Push to `main` → production deploy.
- Open a PR → a preview deploy with its own URL.

## Verify the key is not exposed

On the deployed URL: open DevTools → Network, trigger an AI action (Describe /
Suggest names), and confirm the request goes to `/api/generate` on your own
origin — **not** to `googleapis.com` — and that the key appears nowhere in
`view-source` or the JS bundle.

## Local development

Copy `.env.example` to `.env.local`, set `VITE_GOOGLE_AI_API_KEY`, run
`npm run dev`. Locally the app uses the direct client (no proxy needed). With no
key, AI features are hidden. (To exercise the proxy locally, run `vercel dev`,
which serves the `/api` function alongside the Vite app.)
