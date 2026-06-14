/**
 * @module ai/namer.test
 */

import { describe, expect, it } from 'vitest';

import { parseNameSuggestions } from './namer';

describe('parseNameSuggestions', () => {
  it('parses three "Name — rationale" lines', () => {
    const result = parseNameSuggestions(
      'Aurelia — its golden G-type sun\nVesper — a cool twilight world\nThalassa — an ocean-covered surface',
    );
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'Aurelia', rationale: 'its golden G-type sun' });
    expect(result[2]?.name).toBe('Thalassa');
  });

  it('accepts a hyphen separator with surrounding spaces', () => {
    const result = parseNameSuggestions('Boreas - a frozen polar world');
    expect(result[0]).toEqual({ name: 'Boreas', rationale: 'a frozen polar world' });
  });

  it('keeps a name with no rationale as an empty-rationale suggestion', () => {
    const result = parseNameSuggestions('Halcyon');
    expect(result[0]).toEqual({ name: 'Halcyon', rationale: '' });
  });

  it('drops candidates whose name fails validation (XSS, over-long, EXO- impersonation)', () => {
    const result = parseNameSuggestions(
      '<script> — bad\nEXO-A3F2B1 — impersonation\n' + 'x'.repeat(50) + ' — too long\nAurelia — ok',
    );
    expect(result).toEqual([{ name: 'Aurelia', rationale: 'ok' }]);
  });

  it('caps at three even if the model returns more', () => {
    const result = parseNameSuggestions('A — 1\nB — 2\nC — 3\nD — 4\nE — 5');
    expect(result).toHaveLength(3);
    expect(result.map((s) => s.name)).toEqual(['A', 'B', 'C']);
  });

  it('returns an empty array for empty or garbage input', () => {
    expect(parseNameSuggestions('')).toEqual([]);
    expect(parseNameSuggestions('   \n  \n')).toEqual([]);
  });
});
