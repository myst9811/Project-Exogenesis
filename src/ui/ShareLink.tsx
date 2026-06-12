/**
 * @module ui/ShareLink
 *
 * Copies the current world's shareable URL to the clipboard. The URL is kept
 * in sync with the computed world by the App (ADR-007), so copying the
 * current address is enough — this component does not encode anything itself.
 */

import { useState } from 'react';
import type { JSX } from 'react';

export function ShareLink(): JSX.Element {
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className="share-link">
      <button
        type="button"
        className="tactical-btn accent"
        onClick={() => {
          void copy();
        }}
      >
        ⊕ Share Config
      </button>
      {copied && (
        <span className="share-confirm" role="status">
          Link copied
        </span>
      )}
    </span>
  );
}
