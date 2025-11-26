import {describe, it, expect} from 'vitest';
import {betaPDF, betaRandomSample} from '../../../src/core/statistics';

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

describe('betaRandomSample', () => {
  it('should produce values within (0,1)', () => {
    for (let i = 0; i < 1000; i++) {
      const v = betaRandomSample(2, 3);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('should have mean near a/(a+b) for large samples', () => {
    const a = 2;
    const b = 5;
    const expectedMean = a / (a + b); // ~0.2857

    let sum = 0;
    const N = 5000; // sample size

    for (let i = 0; i < N; i++) {
      sum += betaRandomSample(a, b);
    }

    const mean = sum / N;
    // We allow some stochastic tolerance
    expect(mean).toBeCloseTo(expectedMean, 1); // 1 decimal precision OK
  });

  it('should throw when a<=0 or b<=0', () => {
    expect(() => betaRandomSample(0, 1)).toThrow();
    expect(() => betaRandomSample(1, 0)).toThrow();
    expect(() => betaRandomSample(-1, 2)).toThrow();
    expect(() => betaRandomSample(2, -1)).toThrow();
  });

  it('should produce values in [0,1] for 0 < a,b < 1', () => {
    for (let i = 0; i < 10; i++) {
      const val = betaRandomSample(0.5, 0.8);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});
