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
