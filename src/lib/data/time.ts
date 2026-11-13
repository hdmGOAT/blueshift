// The time axis: every observed quarter, Q1 2003 to Q2 2026 (from the data file).
// Index 0 is Q1 of START_YEAR, so `index % 4` is always the quarter minus one.
// BlueShift shows observations only; it does not forecast yields.
import { OBS } from "./observations";
import type { Quarter } from "./types";

export const START_YEAR = OBS.meta.firstYear;
/** Index of the last observed quarter. */
export const LAST_OBSERVED = OBS.meta.quarters - 1;

export const QUARTERS: Quarter[] = Array.from({ length: OBS.meta.quarters }, (_, i) => ({
  index: i,
  year: START_YEAR + Math.floor(i / 4),
  q: (i % 4) + 1,
}));

/** Every year with at least one observed quarter. */
export const YEARS = Array.from({ length: QUARTERS[LAST_OBSERVED].year - START_YEAR + 1 }, (_, i) => START_YEAR + i);

/** Years with all four quarters observed. Annual analyses use only these. */
export const COMPLETE_YEARS = YEARS.filter((y) => QUARTERS.filter((q) => q.year === y).length === 4);
export const LAST_COMPLETE_YEAR = COMPLETE_YEARS[COMPLETE_YEARS.length - 1];

/** Reference period for "normal" ocean conditions: the first ten complete years. */
export const BASELINE = { from: COMPLETE_YEARS[0], to: COMPLETE_YEARS[0] + 9 } as const;

export const quarterLabel = (i: number) => `Q${QUARTERS[i].q} ${QUARTERS[i].year}`;

/** Quarters a year has, e.g. "Q1–Q2" for a partial year ("" for a complete one). */
export function yearCoverage(year: number) {
  const qs = QUARTERS.filter((q) => q.year === year);
  return qs.length === 4 || !qs.length ? "" : `Q${qs[0].q}–Q${qs[qs.length - 1].q}`;
}

/** Quarter indexes that fall inside [from, to] (years, inclusive). */
export const quartersIn = (from: number, to: number) => QUARTERS.filter((q) => q.year >= from && q.year <= to).map((q) => q.index);
