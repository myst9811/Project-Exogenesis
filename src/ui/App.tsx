/**
 * @module ui/App
 *
 * Root application shell. Creates the application stores once; on mount it
 * loads a shared world from the URL fragment if present, otherwise seeds the
 * default world; thereafter it reflects every computed world back into the
 * URL so the address bar is always a shareable link (ADR-007). Composes the
 * editor: input panels, the 3D viewport, felt-experience readouts, AI
 * narration, diagnostics, and history controls.
 */

import { useEffect, useState } from 'react';
import type { JSX } from 'react';

import {
  type AppStores,
  commitConfiguration,
  createAppStores,
  createDefaultConfiguration,
  designateCurrentWorld,
  encodeConfigurationToken,
  loadConfigurationToken,
  resolveDisplayName,
} from '../store';
import type { SimulationDiagnostic } from '../types/configuration';
import {
  type NameSuggestion,
  type NarrationClient,
  createNarrationClientFromEnv,
  suggestPlanetNames,
} from '../ai';
import { ArchivePanel } from './ArchivePanel';
import { DesignateWorldModal } from './DesignateWorldModal';
import { DiagnosticsList } from './DiagnosticsList';
import { InputPanels } from './InputPanels';
import { MissionIcon } from './MissionIcon';
import { NarrationPanel } from './NarrationPanel';
import { PlanetViewport, type PlanetRendererFactory } from './PlanetViewport';
import { StoresProvider } from './StoresProvider';
import { SystemHeader } from './SystemHeader';
import { useStore } from './useStore';
import { WorldReadouts } from './WorldReadouts';
import { readDisplayName, readWorldToken, writeDisplayName, writeWorldToken } from './worldUrl';

export function App({ createRenderer }: { createRenderer?: PlanetRendererFactory } = {}): JSX.Element {
  const [stores] = useState(createAppStores);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [designating, setDesignating] = useState(false);
  const [designateDiagnostics, setDesignateDiagnostics] = useState<readonly SimulationDiagnostic[]>(
    [],
  );
  const [archiveOpen, setArchiveOpen] = useState(false);

  // On mount: load a shared world from the URL, else seed the default.
  // `active.value` is read across awaits; a holder object avoids the flow
  // narrowing that a plain `let` flag would trigger.
  useEffect(() => {
    const active = { value: true };
    void (async () => {
      const token = readWorldToken();
      if (token !== null) {
        const diagnostics = await loadConfigurationToken(stores, token);
        if (!active.value) {
          return;
        }
        if (diagnostics.length === 0) {
          // Borrow the sharer's name for this session (never auto-archived).
          const inboundName = readDisplayName();
          if (inboundName !== null) {
            stores.ui.setSessionDisplayName(inboundName);
          }
          return;
        }
        setLinkError(diagnostics[0]?.message ?? 'The shared link could not be loaded.');
      }
      if (active.value) {
        await commitConfiguration(stores, createDefaultConfiguration());
      }
    })();
    return () => {
      active.value = false;
    };
  }, [stores]);

  // Reflect every successfully computed world into the URL fragment, and
  // pulse the boot-scan line whenever the computed world changes.
  useEffect(() => {
    let previousHash: string | null = null;
    let scanTimer: ReturnType<typeof setTimeout> | undefined;
    const sync = (): void => {
      const state = stores.simulation.getState();
      if (state.status === 'ready' && state.planetaryState !== null) {
        const hash = state.planetaryState.configurationHash;
        if (previousHash !== null && previousHash !== hash) {
          setScanning(true);
          clearTimeout(scanTimer);
          scanTimer = setTimeout(() => {
            setScanning(false);
          }, 800);
          // A borrowed session name labels only the world it arrived with;
          // moving to a different world drops it.
          if (stores.archive.getState().entries[hash] === undefined) {
            stores.ui.setSessionDisplayName(null);
          }
        }
        previousHash = hash;
        if (state.configuration !== null) {
          writeWorldToken(encodeConfigurationToken(state.configuration));
          const { commonName } = resolveDisplayName(stores.archive.getState(), hash);
          const name = commonName ?? stores.ui.getState().sessionDisplayName;
          if (name !== null) {
            writeDisplayName(name);
          }
        }
      }
    };
    const unsubscribeSimulation = stores.simulation.subscribe(sync);
    const unsubscribeArchive = stores.archive.subscribe(sync);
    sync();
    return () => {
      unsubscribeSimulation();
      unsubscribeArchive();
      clearTimeout(scanTimer);
    };
  }, [stores]);

  return (
    <StoresProvider stores={stores}>
      <div className={scanning ? 'console scanning' : 'console'}>
        <div className="scan-indicator" aria-hidden="true">
          <MissionIcon name="rocket" size={16} state="active" />
        </div>
        <SystemHeader
          onDesignate={() => {
            setDesignateDiagnostics([]);
            setDesignating(true);
          }}
          onOpenArchive={() => {
            setArchiveOpen(true);
          }}
        />
        {designating && (
          <DesignateModalContainer
            stores={stores}
            diagnostics={designateDiagnostics}
            onConfirm={(name) => {
              const diagnostics = designateCurrentWorld(stores, name);
              if (diagnostics.length === 0) {
                setDesignating(false);
              } else {
                setDesignateDiagnostics(diagnostics);
              }
            }}
            onCancel={() => {
              setDesignating(false);
            }}
          />
        )}
        {archiveOpen && (
          <ArchivePanel
            onClose={() => {
              setArchiveOpen(false);
            }}
            onLoad={(entry) => {
              stores.archive.setActive(entry.configurationHash);
              void loadConfigurationToken(stores, entry.shareToken);
              setArchiveOpen(false);
            }}
          />
        )}
        {linkError !== null && (
          <p className="link-error" role="alert">
            {linkError} Showing the default world instead.
          </p>
        )}
        <main className="console-body">
          <section className="parameter-console" aria-label="parameters">
            <p className="console-thesis">
              Set a world&rsquo;s conditions. Science determines its fate.
            </p>
            <InputPanels />
            <DiagnosticsList />
          </section>
          <section className="visualization-console" aria-label="visualization">
            {createRenderer ? (
              <PlanetViewport createRenderer={createRenderer} />
            ) : (
              <PlanetViewport />
            )}
            <WorldReadouts />
            <NarrationPanel />
          </section>
        </main>
      </div>
    </StoresProvider>
  );
}

const EARTH_SURFACE_GRAVITY = 9.806_65;

/**
 * Reads the live computed world and resolves the designate-modal props so the
 * App shell stays lean. Renders nothing until a world exists.
 */
function DesignateModalContainer({
  stores,
  diagnostics,
  onConfirm,
  onCancel,
}: {
  stores: AppStores;
  diagnostics: readonly SimulationDiagnostic[];
  onConfirm: (name: string) => void;
  onCancel: () => void;
}): JSX.Element | null {
  const sim = useStore(stores.simulation);
  const archive = useStore(stores.archive);
  const [nameClient] = useState<NarrationClient | null>(() => createNarrationClientFromEnv());
  const [suggestions, setSuggestions] = useState<readonly NameSuggestion[]>([]);
  const [suggestStatus, setSuggestStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const world = sim.planetaryState;
  if (world === null) {
    return null;
  }
  const designation = `EXO-${world.configurationHash.slice(0, 6).toUpperCase()}`;
  const hzLabel =
    world.habitableZone === null ? 'OUT OF RANGE' : world.habitableZone.position.toUpperCase();
  const requestSuggestions =
    nameClient === null
      ? undefined
      : (): void => {
          setSuggestStatus('generating');
          void suggestPlanetNames(nameClient, world, sim.habitability ?? undefined)
            .then((result) => {
              setSuggestions(result);
              setSuggestStatus('idle');
            })
            .catch(() => {
              setSuggestStatus('error');
            });
        };
  return (
    <DesignateWorldModal
      designation={designation}
      readouts={{
        surfaceTemperatureKelvin: world.climate.surfaceTemperatureKelvin,
        surfaceGravityEarthG: world.bulk.surfaceGravityMetersPerSecondSquared / EARTH_SURFACE_GRAVITY,
        hzLabel,
      }}
      initialName={archive.entries[world.configurationHash]?.commonName ?? ''}
      diagnostics={diagnostics}
      suggestions={suggestions}
      suggestStatus={suggestStatus}
      {...(requestSuggestions !== undefined ? { onRequestSuggestions: requestSuggestions } : {})}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
