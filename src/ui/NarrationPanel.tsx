/**
 * @module ui/NarrationPanel
 *
 * Presents the read-only AI explanation layer: on demand, narrate, explain,
 * or speculate about the computed world. Manages async loading/error states
 * locally (CLAUDE.md §7 roadmap item) and renders speculation distinctly
 * from description/explanation, as §7 requires.
 *
 * The client is injectable (defaulting to the env-configured Gemini adapter)
 * so the wiring is testable without a network. When no client is configured
 * — no API key — the feature is disabled with an explanatory note (TD-015).
 */

import { useState } from 'react';
import type { JSX } from 'react';

import {
  type AIContent,
  type AIRequestStatus,
  type NarrationClient,
  explainMechanism,
  narrateWorld,
  speculateEcology,
} from '../ai';
import { createGeminiClientFromEnv } from '../ai/providers/gemini';
import { MissionIcon } from './MissionIcon';
import type { PlanetaryState } from '../types/physics';
import { useStore } from './useStore';
import { useStores } from './StoresProvider';

export function NarrationPanel({
  client = createGeminiClientFromEnv(),
}: {
  client?: NarrationClient | null;
}): JSX.Element {
  const { simulation } = useStores();
  const world = useStore(simulation).planetaryState;
  const [status, setStatus] = useState<AIRequestStatus>('idle');
  const [content, setContent] = useState<AIContent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const run = async (
    generate: (active: NarrationClient, activeWorld: PlanetaryState) => Promise<AIContent>,
  ): Promise<void> => {
    if (client === null || world === null) {
      return;
    }
    setStatus('generating');
    setErrorMessage('');
    try {
      setContent(await generate(client, world));
      setStatus('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Generation failed.');
      setStatus('error');
    }
  };

  if (client === null) {
    return (
      <section className="narration" aria-label="ai narration">
        <p className="narration-disabled">
          AI narration is disabled. Set <code>VITE_GOOGLE_AI_API_KEY</code> to enable it.
        </p>
      </section>
    );
  }

  const busy = status === 'generating';
  const disabled = busy || world === null;

  return (
    <section className="narration" aria-label="ai narration">
      <div className="narration-actions" role="toolbar">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            void run((active, activeWorld) => narrateWorld(active, activeWorld));
          }}
        >
          Describe this world
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            void run((active, activeWorld) =>
              explainMechanism(active, activeWorld, 'the surface temperature'),
            );
          }}
        >
          Explain the temperature
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            void run((active, activeWorld) => speculateEcology(active, activeWorld));
          }}
        >
          Speculate
        </button>
      </div>

      {status === 'idle' && content === null && (
        <div className="narration-empty">
          <MissionIcon name="rover" size={36} state="idle" />
          <span>No field notes yet — request a narration above.</span>
        </div>
      )}

      {busy && <p className="narration-status">Generating…</p>}
      {status === 'error' && <p className="narration-error">{errorMessage}</p>}

      {content !== null && status === 'ready' && (
        <div className={`narration-content narration-${content.kind}`}>
          {content.kind === 'speculation' && (
            <p className="narration-speculation-label">Scientists speculate that…</p>
          )}
          <p className="narration-text">{content.text}</p>
          {content.speculationBasis !== undefined && (
            <p className="narration-basis">{content.speculationBasis}</p>
          )}
        </div>
      )}
    </section>
  );
}
