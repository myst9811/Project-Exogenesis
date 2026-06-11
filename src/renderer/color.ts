/**
 * @module renderer/color
 *
 * Small shared color helpers for the renderer's derivation layer. Extracted
 * so the per-channel clamp is defined once rather than duplicated across the
 * star, surface, and atmosphere derivations (CLAUDE.md §9).
 */

/** Clamps a value to the [0, 1] channel range. */
export function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}
