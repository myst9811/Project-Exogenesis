/**
 * @module ui/ShareLink.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareLink } from './ShareLink';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ShareLink', () => {
  it('copies the current URL (including any name) for Copy link', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    window.history.replaceState(null, '', '#w=abc&n=Aurelia');

    render(<ShareLink missionBrief="AURELIA (EXO-A3F2B1)" />);
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Link copied');
    });
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('copies the mission brief text for Copy mission brief', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const brief = 'AURELIA (EXO-A3F2B1)';

    render(<ShareLink missionBrief={brief} />);
    fireEvent.click(screen.getByRole('button', { name: /mission brief/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(brief);
    });
  });

  it('shows only Copy link when no mission brief is provided', () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(() => Promise.resolve()) } });
    render(<ShareLink />);
    expect(screen.queryByRole('button', { name: /mission brief/i })).toBeNull();
    expect(screen.getByRole('button', { name: /copy link/i })).not.toBeNull();
  });

  it('does not confirm when the clipboard write fails', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareLink />);
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    await Promise.resolve();
    expect(screen.queryByText('Link copied')).toBeNull();
  });
});
