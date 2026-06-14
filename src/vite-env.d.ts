/// <reference types="vite/client" />

/**
 * Typed build-time environment. `VITE_`-prefixed vars are inlined by Vite and
 * exposed on `import.meta.env`. The Google AI Studio key is optional: when
 * absent, the narration feature is disabled (TD-015).
 */
interface ImportMetaEnv {
  readonly VITE_GOOGLE_AI_API_KEY?: string;
  /** When 'true'/'1' (deployed build), the client uses the /api/generate proxy. */
  readonly VITE_AI_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
