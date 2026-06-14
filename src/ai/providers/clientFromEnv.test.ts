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
