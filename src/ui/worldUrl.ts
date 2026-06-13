/**
 * @module ui/worldUrl
 *
 * The browser glue for shareable world URLs: reads and writes the world
 * token in the location fragment (`#w=<token>`). The fragment keeps sharing
 * a pure client concern — no server round-trip (ARCHITECTURE.md §1). This is
 * the only place that touches `window.location`/`history`; the encoding
 * itself is pure and lives in the configuration layer (ADR-007).
 */

const WORLD_TOKEN_PARAM = 'w';

/** Returns the world token from the current URL fragment, or null if absent. */
export function readWorldToken(): string | null {
  const fragment = window.location.hash.replace(/^#/, '');
  return new URLSearchParams(fragment).get(WORLD_TOKEN_PARAM);
}

/**
 * Writes the world token into the URL fragment via `replaceState` (no new
 * history entry, no reload). A no-op when the fragment already matches, so
 * repeated syncs of an unchanged world do not churn history.
 *
 * @param token - The shared-world token to reflect in the URL
 */
export function writeWorldToken(token: string): void {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  params.set(WORLD_TOKEN_PARAM, token);
  const nextHash = `#${params.toString()}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash);
  }
}

const DISPLAY_NAME_PARAM = 'n';
const MAX_DISPLAY_NAME = 40;

/**
 * Returns the display name from the URL fragment's `n` param, truncated to 40
 * characters, or null if absent. Cosmetic only — never affects decode.
 */
export function readDisplayName(): string | null {
  const fragment = window.location.hash.replace(/^#/, '');
  const value = new URLSearchParams(fragment).get(DISPLAY_NAME_PARAM);
  if (value === null) {
    return null;
  }
  return value.slice(0, MAX_DISPLAY_NAME);
}

/**
 * Writes the display name into the `n` fragment param via `replaceState`,
 * alongside any existing `w` token.
 *
 * @param name - The display name to reflect in the URL
 */
export function writeDisplayName(name: string): void {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  params.set(DISPLAY_NAME_PARAM, name);
  const nextHash = `#${params.toString()}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash);
  }
}
