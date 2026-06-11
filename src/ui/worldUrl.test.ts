/**
 * @module ui/worldUrl.test
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it } from 'vitest';

import { readWorldToken, writeWorldToken } from './worldUrl';

afterEach(() => {
  window.history.replaceState(null, '', '#');
});

describe('worldUrl', () => {
  it('returns null when no token is present', () => {
    window.history.replaceState(null, '', '#');
    expect(readWorldToken()).toBeNull();
  });

  it('round-trips a token through write then read', () => {
    writeWorldToken('abc123');
    expect(readWorldToken()).toBe('abc123');
    expect(window.location.hash).toContain('w=abc123');
  });

  it('replaces an existing token rather than appending', () => {
    writeWorldToken('first');
    writeWorldToken('second');
    expect(readWorldToken()).toBe('second');
  });

  it('is a no-op when the token is unchanged', () => {
    writeWorldToken('same');
    const before = window.location.hash;
    writeWorldToken('same');
    expect(window.location.hash).toBe(before);
  });
});
