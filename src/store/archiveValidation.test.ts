/**
 * @module store/archiveValidation.test
 */

import { describe, expect, it } from 'vitest';

import { validateCommonName } from './archiveValidation';

describe('validateCommonName', () => {
  it('accepts a simple name and trims surrounding whitespace', () => {
    const result = validateCommonName('  Aurelia  ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('Aurelia');
    }
  });

  it('accepts international letters, digits, spaces, hyphen, apostrophe', () => {
    expect(validateCommonName("Zephyr-9 d'Or").ok).toBe(true);
    expect(validateCommonName('Æthel Bjørn').ok).toBe(true);
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(validateCommonName('').ok).toBe(false);
    expect(validateCommonName('   ').ok).toBe(false);
  });

  it('rejects names longer than 40 characters after trim', () => {
    expect(validateCommonName('a'.repeat(41)).ok).toBe(false);
    expect(validateCommonName('a'.repeat(40)).ok).toBe(true);
  });

  it('rejects HTML/control characters and URLs', () => {
    expect(validateCommonName('<script>').ok).toBe(false);
    expect(validateCommonName('a"b').ok).toBe(false);
    expect(validateCommonName('a&b').ok).toBe(false);
    expect(validateCommonName('http://x.com').ok).toBe(false);
    expect(validateCommonName('#tag').ok).toBe(false);
  });

  it('rejects names that impersonate a system designation', () => {
    expect(validateCommonName('EXO-A3F2B1').ok).toBe(false);
    expect(validateCommonName('exo-a3f2b1').ok).toBe(false);
  });

  it('returns a diagnostic message when invalid', () => {
    const result = validateCommonName('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.severity).toBe('error');
      expect(result.diagnostic.message.length).toBeGreaterThan(0);
    }
  });
});
