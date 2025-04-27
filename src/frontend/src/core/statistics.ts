function gamma(n: number): number {
    const g: number = 7;
    const p: number[] = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
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

    const B = (a: number, b: number): number => gamma(a) * gamma(b) / gamma(a + b);

    return (Math.pow(x, a - 1) * Math.pow(1 - x, b - 1)) / B(a, b);
}

export { betaPDF };
