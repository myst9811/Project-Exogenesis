/**
 * Vercel serverless proxy for the AI narration layer (TD-015). Holds the
 * Gemini API key server-side (`GOOGLE_AI_API_KEY`, no VITE_ prefix, so it is
 * never bundled into the client) and forwards a system instruction + user
 * prompt to Gemini. The browser calls this same-origin endpoint instead of
 * Google directly, so the deployed client carries no secret.
 *
 * Hygiene guards only (POST-only, length cap); abuse cost is capped by the
 * Gemini free-tier quota. This is an I/O boundary, verified by deploy.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';
const MAX_PROMPT_CHARS = 8000;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (apiKey === undefined || apiKey === '') {
    res.status(503).json({ error: 'AI is not configured.' });
    return;
  }
  const body = req.body as { systemInstruction?: unknown; userPrompt?: unknown };
  const systemInstruction = body.systemInstruction;
  const userPrompt = body.userPrompt;
  if (
    typeof systemInstruction !== 'string' ||
    typeof userPrompt !== 'string' ||
    userPrompt.length === 0 ||
    userPrompt.length > MAX_PROMPT_CHARS
  ) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }
  try {
    const genai = new GoogleGenAI({ apiKey });
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: { systemInstruction },
    });
    res.status(200).json({ text: response.text ?? '' });
  } catch {
    res.status(502).json({ error: 'Generation failed.' });
  }
}
