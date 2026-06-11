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
});
