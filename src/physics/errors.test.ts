/**
 * @module physics/errors.test
 */

import { describe, expect, it } from 'vitest';

import { PhysicsRangeError } from './errors';

describe('PhysicsRangeError', () => {
  it('formats the parameter, value, valid range, and unit into the message', () => {
    const error = new PhysicsRangeError('mass', -5, [0, Infinity], 'kg');
    expect(error.message).toBe(
      'Physics parameter out of range: mass = -5 kg. Valid range: [0, Infinity] kg',
    );
  });

  it('is an Error with name PhysicsRangeError', () => {
    const error = new PhysicsRangeError('radius', 0, [1, 100], 'm');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PhysicsRangeError');
  });
});
