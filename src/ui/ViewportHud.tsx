/**
 * @module ui/ViewportHud
 *
 * The tactical HUD overlaid on the planet viewport. Every label is derived
 * from real computed state — the designation from the configuration hash
 * (honest and unique, never a fabricated catalog number), and the readouts
 * from the actual stellar/orbital/habitable-zone results. A Δ-indicator
 * pulses briefly when the world changes.
 */

import { useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

import type { HabitableZonePosition } from '../types/physics';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

const HZ_LABEL: Record<HabitableZonePosition, string> = {
  'too-hot': 'INTERIOR · HOT',
  'inside-optimistic': 'INSIDE · OPTIMISTIC',
  'inside-conservative': 'INSIDE · CONSERVATIVE',
  'too-cold': 'EXTERIOR · COLD',
};

const UPDATE_PULSE_MS = 2000;

export function ViewportHud(): JSX.Element | null {
  const { simulation } = useStores();
  const world = useStore(simulation).planetaryState;
  const [updated, setUpdated] = useState(false);
  const previousHash = useRef<string | null>(null);

  const hash = world?.configurationHash ?? null;
  useEffect(() => {
    if (hash === null) {
      return;
    }
    if (previousHash.current !== null && previousHash.current !== hash) {
      setUpdated(true);
      const timer = setTimeout(() => {
        setUpdated(false);
      }, UPDATE_PULSE_MS);
      previousHash.current = hash;
      return () => {
        clearTimeout(timer);
      };
    }
    previousHash.current = hash;
    return undefined;
  }, [hash]);

  if (world === null) {
    return null;
  }

  const designation = `EXO-${world.configurationHash.slice(0, 6).toUpperCase()}`;
  const spectralClass = world.configuration.stellar.spectralClass;
  const orbitAu = world.configuration.orbital.semiMajorAxisAstronomicalUnits;
  const hzLabel =
    world.habitableZone === null ? 'OUT OF RANGE' : HZ_LABEL[world.habitableZone.position];

  return (
    <div className="viewport-hud" aria-hidden="true">
      <div className="hud-corner hud-top-left">
        <span className="hud-key">DESIGNATION</span>
        <span className="hud-value">{designation}</span>
      </div>
      <div className="hud-corner hud-top-right">
        <span className="hud-line">STAR · {spectralClass}-TYPE</span>
        <span className="hud-line">ORBIT · {orbitAu.toFixed(2)} AU</span>
      </div>
      <div className="hud-corner hud-bottom-left">
        <span className="hud-key">HABITABLE ZONE</span>
        <span className="hud-value">{hzLabel}</span>
      </div>
      <div className="hud-corner hud-bottom-right">
        {updated && <span className="hud-delta">● PARAMETERS UPDATED</span>}
      </div>
      <div className="hud-scan-ring" />
    </div>
  );
}
