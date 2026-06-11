/// <reference types="vite/client" />

/**
 * Typed build-time environment. `VITE_`-prefixed vars are inlined by Vite and
 * exposed on `import.meta.env`. The Google AI Studio key is optional: when
 * absent, the narration feature is disabled (TD-015).
 */
interface ImportMetaEnv {
  readonly VITE_GOOGLE_AI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
