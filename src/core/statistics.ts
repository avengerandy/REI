/**
 * Reference: Marsaglia, G. and Tsang, W.W., 2000.
 * A simple method for generating gamma variables.
 */

function gamma(n: number): number {
  const g = 7;
  const p: number[] = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (n < 0.5) {
    return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
  }
  n -= 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) {
    x += p[i] / (n + i);
  }
  const t = n + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
}

function betaPDF(x: number, a: number, b: number): number {
  if (x <= 0 || x >= 1) {
    return 0;
  }

  const B = (a: number, b: number): number => {
    return (gamma(a) * gamma(b)) / gamma(a + b);
  };

  return (Math.pow(x, a - 1) * Math.pow(1 - x, b - 1)) / B(a, b);
}

function sampleGamma(shape: number): number {
  // shape > 0
  if (shape < 1) {
    // Use Johnk's generator via boosting:
    // Gamma(α) = Gamma(α+1) * U^(1/α)
    const u = Math.random();
    return sampleGamma(shape + 1) * Math.pow(u, 1 / shape);
  }

  // shape >= 1 : Marsaglia & Tsang method
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let x: number;
    let v: number;
    do {
      // sample standard normal via Box-Muller
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      x = z;
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();
    // acceptance criterion
    if (
      u < 1 - 0.0331 * (x * x) * (x * x) ||
      Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))
    ) {
      return d * v; // scale theta=1
    }
  }
}

function betaRandomSample(a: number, b: number): number {
  if (a <= 0 || b <= 0) {
    throw new Error('betaRandomSample requires a>0 and b>0');
  }
  const x = sampleGamma(a);
  const y = sampleGamma(b);
  if (x === 0 && y === 0) return 0; // extremely unlikely, but safe-guard
  return x / (x + y);
}

export {betaPDF, betaRandomSample};
