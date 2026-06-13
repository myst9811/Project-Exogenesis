/**
 * @module renderer/cameraView.test
 */

import { describe, expect, it } from 'vitest';

import { deriveCameraTarget } from './cameraView';

describe('deriveCameraTarget', () => {
  it('frames Observation at the default mid distance, schematic hidden', () => {
    const t = deriveCameraTarget('observation');
    expect(t.positionZ).toBeCloseTo(3.2, 5);
    expect(t.schematicVisible).toBe(false);
  });

  it('moves the camera closer for Surface than for Observation', () => {
    expect(deriveCameraTarget('surface').positionZ).toBeLessThan(
      deriveCameraTarget('observation').positionZ,
    );
    expect(deriveCameraTarget('surface').schematicVisible).toBe(false);
  });

  it('pulls the camera back for System and shows the schematic', () => {
    const system = deriveCameraTarget('system');
    expect(system.positionZ).toBeGreaterThan(deriveCameraTarget('observation').positionZ);
    expect(system.schematicVisible).toBe(true);
  });
});
