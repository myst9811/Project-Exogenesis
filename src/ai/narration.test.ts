/**
 * @module ai/narration.test
 *
 * Tests the narrator/educator/speculator wiring against a fake client.
 * Per CLAUDE.md §11 we test prompt construction and output tagging — the
 * deterministic parts — never the model's generated text.
 */

import { describe, expect, it, vi } from 'vitest';

import { hashConfiguration } from '../physics/configuration/manifest';
import { computePlanetaryState } from '../physics';
import { createEarthBaselineConfiguration } from '../physics/configuration/earthBaseline';
import type { PlanetaryState } from '../types/physics';
import type { NarrationClient, NarrationRequest } from './client';
import { explainMechanism } from './educator';
import { narrateWorld } from './narrator';
import { speculateEcology } from './speculator';

async function earthState(): Promise<PlanetaryState> {
  const manifest = await hashConfiguration(createEarthBaselineConfiguration());
  return computePlanetaryState(manifest);
}

/** A fake client that records the request and returns canned (untrimmed) text. */
function fakeClient(reply = '  canned reply  '): {
  client: NarrationClient;
  lastRequest: () => NarrationRequest | undefined;
} {
  const generate = vi.fn((_request: NarrationRequest) => Promise.resolve(reply));
  return {
    client: { generate },
    lastRequest: () => generate.mock.calls.at(-1)?.[0],
  };
}

describe('narrateWorld', () => {
  it('tags output as description and trims the model text', async () => {
    const { client } = fakeClient();
    const content = await narrateWorld(client, await earthState());
    expect(content.kind).toBe('description');
    expect(content.text).toBe('canned reply');
    expect(content.speculationBasis).toBeUndefined();
  });

  it('sends the description system instruction and the computed context', async () => {
    const fake = fakeClient();
    await narrateWorld(fake.client, await earthState());
    const request = fake.lastRequest();
    expect(request?.systemInstruction).toContain('Do NOT generate');
    expect(request?.userPrompt).toContain('surfaceTemperatureKelvin');
  });
});

describe('explainMechanism', () => {
  it('tags output as explanation and includes the topic in the prompt', async () => {
    const fake = fakeClient();
    const content = await explainMechanism(fake.client, await earthState(), 'the greenhouse effect');
    expect(content.kind).toBe('explanation');
    expect(fake.lastRequest()?.userPrompt).toContain('the greenhouse effect');
  });
});

describe('speculateEcology', () => {
  it('tags output as speculation and attaches an extrapolation basis', async () => {
    const fake = fakeClient();
    const content = await speculateEcology(fake.client, await earthState());
    expect(content.kind).toBe('speculation');
    expect(content.speculationBasis).toContain('not computed by the physics engine');
    expect(fake.lastRequest()?.systemInstruction).toContain('clearly-labeled speculation');
  });
});
