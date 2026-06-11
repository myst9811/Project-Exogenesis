/**
 * @module ai/providers/gemini
 *
 * The live Gemini adapter for {@link NarrationClient} (TD-015). This is the
 * only file that knows the `@google/genai` SDK; the narrator/educator/
 * speculator depend on the interface, not on this. It is an I/O boundary
 * (network + SDK), so it is excluded from unit coverage and verified by
 * typecheck and by running the app — analogous to the Three.js scene.
 *
 * Browser key exposure: a single-page client cannot hold a secret. The key
 * comes from a build-time env var (`VITE_GOOGLE_AI_API_KEY`) and is visible
 * client-side; the free tier caps abuse cost. A production deployment would
 * point this adapter at a key-holding proxy instead (TD-015).
 */

import { GoogleGenAI } from '@google/genai';

import type { NarrationClient, NarrationRequest } from '../client';

/** Default free-tier model (Google AI Studio); override via options. */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export interface GeminiClientOptions {
  /** Google AI Studio API key. */
  apiKey: string;
  /** Model id; defaults to {@link DEFAULT_GEMINI_MODEL}. */
  model?: string;
}

/**
 * Creates a {@link NarrationClient} backed by the Gemini Developer API.
 *
 * @param options - API key and optional model id
 * @returns A narration client that calls Gemini
 */
export function createGeminiClient(options: GeminiClientOptions): NarrationClient {
  const genai = new GoogleGenAI({ apiKey: options.apiKey });
  const model = options.model ?? DEFAULT_GEMINI_MODEL;

  return {
    generate: async (request: NarrationRequest): Promise<string> => {
      const response = await genai.models.generateContent({
        model,
        contents: request.userPrompt,
        config: { systemInstruction: request.systemInstruction },
      });
      return response.text ?? '';
    },
  };
}

/**
 * Builds a Gemini client from the build-time environment, or returns `null`
 * when no key is configured — letting the UI disable narration gracefully
 * rather than fail. The key is read from `VITE_GOOGLE_AI_API_KEY`.
 *
 * @returns A narration client, or `null` if no API key is set
 */
export function createGeminiClientFromEnv(): NarrationClient | null {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    return null;
  }
  return createGeminiClient({ apiKey });
}
