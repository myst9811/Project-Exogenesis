/**
 * @module ai/providers/proxy.test
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProxyClient } from './proxy';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createProxyClient', () => {
  it('POSTs the request as JSON to the endpoint and returns the text', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ text: 'A blue world.' }), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createProxyClient('/api/generate');
    const result = await client.generate({ systemInstruction: 'sys', userPrompt: 'usr' });

    expect(result).toBe('A blue world.');
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/generate');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      systemInstruction: 'sys',
      userPrompt: 'usr',
    });
  });

  it('returns an empty string when the response has no text', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))));
    const client = createProxyClient();
    expect(await client.generate({ systemInstruction: 's', userPrompt: 'u' })).toBe('');
  });

  it('throws when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('nope', { status: 502 }))));
    const client = createProxyClient();
    await expect(client.generate({ systemInstruction: 's', userPrompt: 'u' })).rejects.toThrow(
      /502/,
    );
  });
});
