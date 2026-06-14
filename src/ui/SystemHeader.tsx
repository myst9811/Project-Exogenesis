/**
 * @module ui/SystemHeader
 *
 * The full-width console header: system identity (left), live system status
 * (center), and the undo/redo + share controls (right).
 */

import type { JSX } from 'react';

import { resolveDisplayName } from '../store';
import { HistoryControls } from './HistoryControls';
import { MissionIcon } from './MissionIcon';
import { ShareLink } from './ShareLink';
import { SystemStatus } from './SystemStatus';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

/**
 * Builds the plain-text "mission brief" for the current world when it has a
 * display name (archived or borrowed from a shared link); otherwise the share
 * control falls back to a link-only copy.
 */
function useMissionBrief(): string | undefined {
  const { simulation, archive, ui } = useStores();
  const world = useStore(simulation).planetaryState;
  const archiveState = useStore(archive);
  const sessionDisplayName = useStore(ui).sessionDisplayName;
  if (world === null) {
    return undefined;
  }
  const { designation, commonName } = resolveDisplayName(archiveState, world.configurationHash);
  const name = commonName ?? sessionDisplayName;
  if (name === null || designation === null) {
    return undefined;
  }
  const tempCelsius = Math.round(world.climate.surfaceTemperatureKelvin - 273.15);
  return (
    `${name.toUpperCase()} (${designation})\n` +
    `A ${world.configuration.stellar.spectralClass}-type world, surface near ${tempCelsius}°C.\n` +
    window.location.href
  );
}

export function SystemHeader({
  onDesignate,
  onOpenArchive,
}: {
  onDesignate: () => void;
  onOpenArchive: () => void;
}): JSX.Element {
  const missionBrief = useMissionBrief();
  return (
    <header className="system-header">
      <div className="header-left">
        <span className="system-logo">
          <MissionIcon name="rocket" size={22} state="active" />
        </span>
        <div className="system-id">
          <h1 className="system-name">Project Exogenesis</h1>
          <div className="system-subtitle">Astrometric Simulation Console · v0.1.0</div>
        </div>
      </div>

      <div className="header-center">
        <SystemStatus />
      </div>

      <div className="header-right">
        <HistoryControls />
        <button type="button" className="tactical-btn" onClick={onOpenArchive}>
          ◫ Exploration Archive
        </button>
        <button type="button" className="tactical-btn" onClick={onDesignate}>
          ✦ Designate World
        </button>
        <ShareLink {...(missionBrief !== undefined ? { missionBrief } : {})} />
      </div>
    </header>
  );
}
