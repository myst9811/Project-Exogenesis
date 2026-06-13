/**
 * @module ui/SpectralClassSelector.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SPECTRAL_CLASSES } from '../types/configuration';
import { SpectralClassSelector } from './SpectralClassSelector';

afterEach(cleanup);

describe('SpectralClassSelector', () => {
  it('marks the current value as checked', () => {
    render(<SpectralClassSelector value="G" options={SPECTRAL_CLASSES} onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'G' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'M' }).getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange with the chosen class', () => {
    const onChange = vi.fn();
    render(<SpectralClassSelector value="G" options={SPECTRAL_CLASSES} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'M' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('M');
  });

  it('does not fire onChange when the active option is clicked', () => {
    const onChange = vi.fn();
    render(<SpectralClassSelector value="G" options={SPECTRAL_CLASSES} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'G' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
