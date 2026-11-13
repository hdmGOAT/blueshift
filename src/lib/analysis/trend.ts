// Change over a period, measured on a fitted straight line so a single odd
// first or last value does not dominate. Skips unrecorded (null) values. Pure.
import { linreg } from "./stats";

export type Change = {
  /** Fitted value at the first and last recorded period. */
  start: number;
  end: number;
  /** end - start. */
  abs: number;
  /** Percent change from start (null when start is ~0 or there is too little data). */
  pct: number | null;
  /** Slope per decade, given the number of periods per year. */
  perDecade: number;
};

export function fittedChange(values: (number | null)[], periodsPerYear: number): Change {
  const xs: number[] = [];
  const ys: number[] = [];
  values.forEach((v, i) => v !== null && (xs.push(i), ys.push(v)));
  if (xs.length < 2) return { start: ys[0] ?? 0, end: ys[0] ?? 0, abs: 0, pct: null, perDecade: 0 };
  const { slope, intercept } = linreg(xs, ys);
  const start = intercept + slope * xs[0];
  const end = intercept + slope * xs[xs.length - 1];
  return { start, end, abs: end - start, pct: Math.abs(start) > 1e-9 ? ((end - start) / start) * 100 : null, perDecade: slope * periodsPerYear * 10 };
}
