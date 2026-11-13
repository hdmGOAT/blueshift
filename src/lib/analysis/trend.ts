// Change over a period, measured on a fitted straight line so a single odd
// first or last value does not dominate. Pure.
import { linreg } from "./stats";

export type Change = {
  /** Fitted value at the first and last period. */
  start: number;
  end: number;
  /** end - start. */
  abs: number;
  /** Percent change from start (null when start is ~0). */
  pct: number | null;
  /** Slope per decade, given the number of periods per year. */
  perDecade: number;
};

export function fittedChange(values: number[], periodsPerYear: number): Change {
  if (values.length < 2) return { start: values[0] ?? 0, end: values[0] ?? 0, abs: 0, pct: null, perDecade: 0 };
  const { slope, intercept } = linreg(values.map((_, i) => i), values);
  const start = intercept;
  const end = intercept + slope * (values.length - 1);
  return { start, end, abs: end - start, pct: Math.abs(start) > 1e-9 ? ((end - start) / start) * 100 : null, perDecade: slope * periodsPerYear * 10 };
}
