import {describe, it, expect} from 'vitest';
import {betaPDF} from '../../../src/core/statistics';

describe('betaPDF', () => {
  it('should return 0 when x <= 0 or x >= 1', () => {
    expect(betaPDF(0, 2, 3)).toBe(0);
    expect(betaPDF(1, 2, 3)).toBe(0);
    expect(betaPDF(-0.1, 2, 3)).toBe(0);
    expect(betaPDF(1.1, 2, 3)).toBe(0);
  });

  it('should compute correct values for symmetric beta distribution (a = b = 1)', () => {
    // Beta(1,1) = uniform(0,1) → pdf = 1
    const xs = [0.1, 0.5, 0.9];
    for (const x of xs) {
      expect(betaPDF(x, 1, 1)).toBeCloseTo(1, 6);
    }
  });

  it('should compute higher density near 0 for a < b', () => {
    const nearZero = betaPDF(0.1, 2, 5);
    const nearOne = betaPDF(0.9, 2, 5);
    expect(nearZero).toBeGreaterThan(nearOne);
  });

  it('should compute higher density near 1 for a > b', () => {
    const nearZero = betaPDF(0.1, 5, 2);
    const nearOne = betaPDF(0.9, 5, 2);
    expect(nearOne).toBeGreaterThan(nearZero);
  });

  it('should correctly compute when parameters < 0.5 (gamma reflection branch)', () => {
    const value = betaPDF(0.5, 0.3, 1.2);
    expect(value).toBeGreaterThan(0);
    expect(isFinite(value)).toBe(true);
  });

  it('should produce finite positive values for normal input', () => {
    const value = betaPDF(0.5, 2, 3);
    expect(value).toBeGreaterThan(0);
    expect(isFinite(value)).toBe(true);
  });
});
