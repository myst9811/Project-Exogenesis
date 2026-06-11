/**
 * @module ai
 *
 * The read-only AI explanation layer (CLAUDE.md §7, ADR-003): narrator,
 * educator, and speculator over computed `PlanetaryState`. Provider-agnostic
 * via `NarrationClient` (TD-008); the live Gemini adapter (TD-015) lives in
 * `./providers` and is the only file that knows the SDK. This layer reads
 * physics *types* only and never produces or influences simulation values.
 */

export type { AIContent, AIContentKind, AIRequestStatus } from '../types/ai';
export type { NarrationClient, NarrationRequest } from './client';
export { buildPlanetaryContext } from './context';
export { narrateWorld } from './narrator';
export { explainMechanism } from './educator';
export { speculateEcology } from './speculator';
