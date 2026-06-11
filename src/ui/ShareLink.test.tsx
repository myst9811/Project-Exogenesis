/**
 * @module ui/ShareLink.test
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareLink } from './ShareLink';

afterEach(cleanup);

describe('ShareLink', () => {
  it('copies the current URL and confirms', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareLink />);
    fireEvent.click(screen.getByRole('button', { name: /Share Config/ }));

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Link copied');
    });
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    vi.unstubAllGlobals();
  });

  it('does not confirm when the clipboard write fails', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareLink />);
    fireEvent.click(screen.getByRole('button', { name: /Share Config/ }));

    // Give the rejected promise a chance to settle, then assert no confirmation.
    await Promise.resolve();
    expect(screen.queryByText('Link copied')).toBeNull();
    vi.unstubAllGlobals();
  });
});
