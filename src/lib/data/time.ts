// The time axis: 44 quarters, Q1 2016 to Q4 2026. The last one is a forecast.
import type { Quarter } from "./types";

export const START_YEAR = 2016;

export const QUARTERS: Quarter[] = Array.from({ length: 44 }, (_, i) => ({
  index: i,
  year: START_YEAR + Math.floor(i / 4),
  q: (i % 4) + 1,
}));

export const YEARS = Array.from({ length: 11 }, (_, i) => START_YEAR + i);

/** Index of the last quarter with observed data (Q3 2026). */
export const LAST_OBSERVED = 42;
/** Index of the model-forecast quarter (Q4 2026). */
export const FORECAST_INDEX = 43;

export const quarterLabel = (i: number) => `Q${QUARTERS[i].q} ${QUARTERS[i].year}`;
