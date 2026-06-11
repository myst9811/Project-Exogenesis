/**
 * @module ui/NumberField.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NumberField } from './NumberField';

afterEach(cleanup);

describe('NumberField', () => {
  it('commits a changed value on blur', () => {
    const onCommit = vi.fn();
    render(<NumberField label="Mass" value={5} onCommit={onCommit} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(8);
  });

  it('commits on Enter', () => {
    const onCommit = vi.fn();
    render(<NumberField label="Mass" value={5} onCommit={onCommit} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('does not commit and reverts when the entry is not a finite number', () => {
    const onCommit = vi.fn();
    render(<NumberField label="Mass" value={5} onCommit={onCommit} />);
    const input = screen.getByRole<HTMLInputElement>('spinbutton');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe('5');
  });

  it('does not commit when the value is unchanged', () => {
    const onCommit = vi.fn();
    render(<NumberField label="Mass" value={5} onCommit={onCommit} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('renders the unit in the label when provided', () => {
    render(<NumberField label="Mass" unit="M⊕" value={1} onCommit={vi.fn()} />);
    expect(screen.getByText('Mass (M⊕)')).toBeTruthy();
  });

  it('nudges up by one step on the increase button, avoiding float noise', () => {
    const onCommit = vi.fn();
    render(<NumberField label="Mass" value={1} step={0.1} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Mass' }));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(1.1);
  });

  it('nudges down and clamps to the minimum', () => {
    const onCommit = vi.fn();
    render(<NumberField label="Mass" value={0.05} min={0} step={0.1} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Mass' }));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('does not commit a nudge that would not change the clamped value', () => {
    const onCommit = vi.fn();
    render(<NumberField label="Mass" value={0} min={0} step={0.1} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Mass' }));
    expect(onCommit).not.toHaveBeenCalled();
  });
});
