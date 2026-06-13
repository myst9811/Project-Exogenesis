/**
 * @module ui/DesignateWorldModal.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DesignateWorldModal } from './DesignateWorldModal';

afterEach(cleanup);

const readouts = { surfaceTemperatureKelvin: 288, surfaceGravityEarthG: 1, hzLabel: 'INSIDE · OPTIMISTIC' };

describe('DesignateWorldModal', () => {
  it('confirms with the entered name', () => {
    const onConfirm = vi.fn();
    render(
      <DesignateWorldModal
        designation="EXO-A3F2B1"
        readouts={readouts}
        initialName=""
        diagnostics={[]}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText(/common name/i), { target: { value: 'Aurelia' } });
    fireEvent.click(screen.getByRole('button', { name: /designate/i }));
    expect(onConfirm).toHaveBeenCalledWith('Aurelia');
  });

  it('disables confirm when the field is empty', () => {
    render(
      <DesignateWorldModal
        designation="EXO-A3F2B1"
        readouts={readouts}
        initialName=""
        diagnostics={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /designate/i }).hasAttribute('disabled')).toBe(true);
  });

  it('shows a validation diagnostic when provided', () => {
    render(
      <DesignateWorldModal
        designation="EXO-A3F2B1"
        readouts={readouts}
        initialName="EXO-A3F2B1"
        diagnostics={[
          {
            severity: 'error',
            parameter: 'archive.commonName',
            message: 'That looks like a system designation. Choose a different common name.',
            explanation: '',
          },
        ]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/system designation/i)).not.toBeNull();
  });

  it('cancels', () => {
    const onCancel = vi.fn();
    render(
      <DesignateWorldModal
        designation="EXO-A3F2B1"
        readouts={readouts}
        initialName=""
        diagnostics={[]}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
