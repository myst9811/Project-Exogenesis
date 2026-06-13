/**
 * @module ui/worldUrl.test
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it } from 'vitest';

import { readDisplayName, readWorldToken, writeDisplayName, writeWorldToken } from './worldUrl';

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

describe('worldUrl display name', () => {
  it('reads null when no n param is present', () => {
    window.history.replaceState(null, '', '#w=abc');
    expect(readWorldToken()).toBe('abc');
    expect(readDisplayName()).toBeNull();
  });

  it('round-trips a display name through the n param', () => {
    window.history.replaceState(null, '', '#w=abc');
    writeDisplayName('Zephyr 9');
    expect(readDisplayName()).toBe('Zephyr 9');
    expect(readWorldToken()).toBe('abc');
  });

  it('decodes URL-encoded names', () => {
    window.history.replaceState(null, '', '#w=abc&n=Z%C3%A9phyr');
    expect(readDisplayName()).toBe('Zéphyr');
  });

  it('truncates an over-long name to 40 characters', () => {
    window.history.replaceState(null, '', `#w=abc&n=${'a'.repeat(60)}`);
    expect(readDisplayName()?.length).toBe(40);
  });
});
