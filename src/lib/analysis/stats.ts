// Statistics used by the Relationship Explorer and the summaries.
// Pure functions on plain number arrays. No data imports, so they are easy to
// test and safe to run on the server or in the browser.

export const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

export function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** 1-based ranks; ties get the average of the ranks they span. */
export function ranks(a: number[]) {
  const order = a.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0]);
  const out = new Array<number>(a.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k][1]] = avg;
    i = j + 1;
  }
  return out;
}

/** Spearman's rho: Pearson on ranks (handles ties). */
export const spearman = (a: number[], b: number[]) => pearson(ranks(a), ranks(b));

/** Ordinary least squares fit y = intercept + slope * x. */
export function linreg(x: number[], y: number[]) {
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  const slope = sxx ? sxy / sxx : 0;
  return { slope, intercept: my - slope * mx };
}

/** Residuals of y after removing a straight-line trend over its index. Nulls stay null. */
export function detrend<T extends number | null>(y: T[]): T[] {
  const xs: number[] = [];
  const ys: number[] = [];
  y.forEach((v, i) => v !== null && (xs.push(i), ys.push(v)));
  if (xs.length < 2) return y;
  const { slope, intercept } = linreg(xs, ys);
  return y.map((v, i) => (v === null ? v : ((v as number) - (intercept + slope * i)) as T));
}

// ---- Significance --------------------------------------------------------------

// Lanczos approximation of ln Γ(z).
const LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lnGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i + 1);
  const t = z + LANCZOS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Continued fraction for the incomplete beta function (Numerical Recipes, betacf).
function betacf(a: number, b: number, x: number) {
  const TINY = 1e-30;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  d = 1 / (Math.abs(d) < TINY ? TINY : d);
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 / (Math.abs(1 + aa * d) < TINY ? TINY : 1 + aa * d);
    c = Math.abs(1 + aa / c) < TINY ? TINY : 1 + aa / c;
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 / (Math.abs(1 + aa * d) < TINY ? TINY : 1 + aa * d);
    c = Math.abs(1 + aa / c) < TINY ? TINY : 1 + aa / c;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}

/** Regularised incomplete beta I_x(a, b). */
export function incompleteBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (front * betacf(a, b, x)) / a : 1 - (front * betacf(b, a, 1 - x)) / b;
}

/**
 * Two-sided p-value for a correlation r from n pairs, using the t-test
 * t = r·√((n−2)/(1−r²)) with n−2 degrees of freedom.
 */
export function correlationP(r: number, n: number) {
  if (n < 3) return 1;
  const df = n - 2;
  const r2 = Math.min(r * r, 1 - 1e-15);
  const t2 = (r2 * df) / (1 - r2);
  return incompleteBeta(df / (df + t2), df / 2, 0.5);
}
