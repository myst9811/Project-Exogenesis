/**
 * @module ui/AtmosphereBar
 *
 * A stacked composition bar of atmospheric gases by partial pressure, with a
 * mono legend showing each gas's share. Reads computed configuration values
 * only — the per-gas partial pressures the user set. An airless world renders
 * an explicit note rather than an empty bar.
 */

import type { JSX } from 'react';

import { ATMOSPHERIC_GASES } from '../types/configuration';
import type { AtmosphericGas } from '../types/configuration';

/** Decorative swatch color per gas (tactical palette tokens). */
const GAS_COLOR: Record<AtmosphericGas, string> = {
  N2: 'var(--cyan-dim)',
  O2: 'var(--cyan-bright)',
  CO2: 'var(--amber-mid)',
  H2O: 'var(--cyan-mid)',
  CH4: 'var(--amber-bright)',
  H2: 'var(--status-unknown)',
  He: 'var(--text-secondary)',
  Ar: 'var(--status-caution)',
};

interface GasShare {
  gas: AtmosphericGas;
  kilopascals: number;
  fraction: number;
}

export function AtmosphereBar({
  partialPressuresKilopascals,
}: {
  partialPressuresKilopascals: Partial<Record<AtmosphericGas, number>>;
}): JSX.Element {
  const present: { gas: AtmosphericGas; kilopascals: number }[] = ATMOSPHERIC_GASES.filter(
    (gas) => (partialPressuresKilopascals[gas] ?? 0) > 0,
  ).map((gas) => ({ gas, kilopascals: partialPressuresKilopascals[gas] ?? 0 }));

  const total = present.reduce((sum, entry) => sum + entry.kilopascals, 0);

  if (total <= 0) {
    return (
      <p className="atmosphere-empty" aria-label="atmosphere composition">
        No atmosphere — airless world.
      </p>
    );
  }

  const shares: GasShare[] = present.map((entry) => ({
    ...entry,
    fraction: entry.kilopascals / total,
  }));

  const summary = shares.map((s) => `${Math.round(s.fraction * 100)}% ${s.gas}`).join(', ');

  return (
    <div className="atmosphere-bar" aria-label={`Atmosphere composition: ${summary}`}>
      <div className="atmosphere-track">
        {shares.map((s) => (
          <div
            key={s.gas}
            className="atmosphere-segment"
            style={{ flexBasis: `${s.fraction * 100}%`, background: GAS_COLOR[s.gas] }}
          />
        ))}
      </div>
      <div className="atmosphere-legend">
        {shares.map((s) => (
          <span key={s.gas} className="atmosphere-legend-item">
            <span className="atmosphere-swatch" style={{ background: GAS_COLOR[s.gas] }} />
            {s.gas}
            <span className="atmosphere-legend-value">{(s.fraction * 100).toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
