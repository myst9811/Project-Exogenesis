/**
 * @module ui/ShareLink
 *
 * Copies the current world's shareable link, and—when the world is named—a
 * plain-text "mission brief" (name, designation, science hook, URL) for
 * pasting into chat. The URL is kept in sync with the world by the App
 * (ADR-007), including any `n` display-name param, so copying the current
 * address is sufficient.
 */

import { useState } from 'react';
import type { JSX } from 'react';

export function ShareLink({ missionBrief }: { missionBrief?: string }): JSX.Element {
  const [copied, setCopied] = useState<'link' | 'brief' | null>(null);

  const copy = async (what: 'link' | 'brief'): Promise<void> => {
    const text = what === 'link' ? window.location.href : (missionBrief ?? window.location.href);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied(null);
    }
  };

  return (
    <span className="share-link">
      <button
        type="button"
        className="tactical-btn accent"
        onClick={() => {
          void copy('link');
        }}
      >
        ⊕ Copy link
      </button>
      {missionBrief !== undefined && (
        <button
          type="button"
          className="tactical-btn"
          onClick={() => {
            void copy('brief');
          }}
        >
          Copy mission brief
        </button>
      )}
      {copied !== null && (
        <span className="share-confirm" role="status">
          {copied === 'link' ? 'Link copied' : 'Brief copied'}
        </span>
      )}
    </span>
  );
}
