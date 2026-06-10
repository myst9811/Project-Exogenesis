/**
 * @module physics/errors
 *
 * Error types thrown at physics function boundaries (CLAUDE.md §19).
 * The physics engine never silently returns invalid values: out-of-range
 * inputs throw, and the store layer translates caught errors into
 * SimulationDiagnostic values for the UI.
 */

/** Thrown when a physics function receives a parameter outside its valid range. */
export class PhysicsRangeError extends Error {
  constructor(
    parameter: string,
    value: number,
    validRange: readonly [number, number],
    unit: string,
  ) {
    super(
      `Physics parameter out of range: ${parameter} = ${value} ${unit}. ` +
        `Valid range: [${validRange[0]}, ${validRange[1]}] ${unit}`,
    );
    this.name = 'PhysicsRangeError';
  }
}
