// The time axis: 43 observed quarters, Q1 2016 to Q3 2026.
// BlueShift shows observations only; it does not forecast yields.
import type { Quarter } from "./types";

export const START_YEAR = 2016;
/** Index of the last quarter with observed data (Q3 2026). */
export const LAST_OBSERVED = 42;

export const QUARTERS: Quarter[] = Array.from({ length: LAST_OBSERVED + 1 }, (_, i) => ({
  index: i,
  year: START_YEAR + Math.floor(i / 4),
  q: (i % 4) + 1,
}));

/** Every year with at least one observed quarter (2016-2026). */
export const YEARS = Array.from({ length: QUARTERS[LAST_OBSERVED].year - START_YEAR + 1 }, (_, i) => START_YEAR + i);

/** Years with all four quarters observed. Annual analyses use only these. */
export const COMPLETE_YEARS = YEARS.filter((y) => QUARTERS.filter((q) => q.year === y).length === 4);

export const quarterLabel = (i: number) => `Q${QUARTERS[i].q} ${QUARTERS[i].year}`;

/** Quarter indexes that fall inside [from, to] (years, inclusive). */
export const quartersIn = (from: number, to: number) => QUARTERS.filter((q) => q.year >= from && q.year <= to).map((q) => q.index);
