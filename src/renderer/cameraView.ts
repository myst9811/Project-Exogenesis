/**
 * @module renderer/cameraView
 *
 * Pure per-view camera geometry for the viewport perspectives. Maps a
 * `PlanetView` to the camera's target position and whether the System
 * schematic (star marker + orbit ring) is shown. Kept pure and free of
 * Three.js so it is unit-testable without a WebGL context (CLAUDE.md §11);
 * the scene applies these targets and animates toward them.
 */

import type { PlanetView } from '../types/render';

/** A camera framing target the scene lerps toward. Units are scene units. */
export interface CameraTarget {
  positionX: number;
  positionY: number;
  positionZ: number;
  /** Whether the System schematic group is visible in this view. */
  schematicVisible: boolean;
}

/** Planet sits at the origin with radius 1; these frame it three ways. */
const TARGETS: Record<PlanetView, CameraTarget> = {
  // Default mid-distance orbital view (matches the original fixed camera).
  observation: { positionX: 0, positionY: 0, positionZ: 3.2, schematicVisible: false },
  // Close pass: skim the computed terrain, slightly above the equator.
  surface: { positionX: 0, positionY: 0.35, positionZ: 1.25, schematicVisible: false },
  // Pulled back and raised to look down on the labeled orbit schematic.
  system: { positionX: 0, positionY: 3.5, positionZ: 8, schematicVisible: true },
};

/**
 * Returns the camera target for a view.
 *
 * @param view - The selected viewport perspective
 * @returns The target camera position and schematic visibility
 */
export function deriveCameraTarget(view: PlanetView): CameraTarget {
  return TARGETS[view];
}
