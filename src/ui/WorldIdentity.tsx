/**
 * @module ui/WorldIdentity
 *
 * Renders a world's two names: the optional cosmetic common name (prominent)
 * and the honest, immutable `EXO-` designation (always shown). Pure
 * presentational chrome; the names are resolved upstream by `resolveDisplayName`.
 */

import type { JSX } from 'react';

export function WorldIdentity({
  designation,
  commonName,
  size,
}: {
  designation: string;
  commonName: string | null;
  size: 'hud' | 'header' | 'card';
}): JSX.Element {
  return (
    <span className={`world-identity world-identity--${size}`}>
      {commonName !== null && <span className="world-identity__name">{commonName}</span>}
      <span className="world-identity__designation">
        {commonName !== null ? `EXO · ${designation.replace(/^EXO-/, '')}` : designation}
      </span>
    </span>
  );
}
