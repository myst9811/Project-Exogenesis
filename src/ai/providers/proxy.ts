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
