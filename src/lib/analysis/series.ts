// Turns the quarterly data into period series (quarters or years) for any
// area, species set and year range. Every summary and the analysis build on this.
// Landings can be null (not recorded); every helper here passes nulls through
// rather than treating them as zero.
import { COMPLETE_YEARS, QUARTERS, SPECIES, areaOcean, areaYields, quarterLabel, quartersIn, type AreaId, type Layer } from "@/lib/data";
import { mean } from "./stats";
import type { Resolution } from "./params";

export type Value = number | null;

export type Period = {
  /** "2019" or "2019-Q3". */
  key: string;
  /** "2019" or "Q3 2019". */
  label: string;
  year: number;
  /** Quarter of the year (1-4), quarterly periods only. */
  q?: number;
  /** Quarter indexes that make up the period. */
  quarters: number[];
};

/** The periods inside [from, to]. Annual uses complete years only. */
export function periods(resolution: Resolution, from: number, to: number): Period[] {
  if (resolution === "annual")
    return COMPLETE_YEARS.filter((y) => y >= from && y <= to).map((y) => ({ key: String(y), label: String(y), year: y, quarters: quartersIn(y, y) }));
  return quartersIn(from, to).map((i) => ({ key: `${QUARTERS[i].year}-Q${QUARTERS[i].q}`, label: quarterLabel(i), year: QUARTERS[i].year, q: QUARTERS[i].q, quarters: [i] }));
}

/** Mean ocean value per period (ocean data has no gaps). */
export function envSeries(area: AreaId, variable: Layer, per: Period[]) {
  const ocean = areaOcean(area);
  return per.map((p) => mean(p.quarters.map((i) => ocean[i][variable])));
}

/**
 * Landings per period, summed over the species (empty = all species).
 * A species' period total is null if any of its quarters is unrecorded (a
 * partial sum would look like a drop); the sum across species skips null
 * species and is null only when every species is null.
 */
export function yieldSeries(area: AreaId, speciesIds: string[], per: Period[]): Value[] {
  const ids = speciesIds.length ? speciesIds : SPECIES.map((s) => s.id);
  const series = ids.map((id) => areaYields(area, id));
  return per.map((p) => {
    let total: Value = null;
    for (const ys of series) {
      let sum = 0;
      for (const i of p.quarters) {
        const v = ys[i].value;
        if (v === null) {
          sum = NaN;
          break;
        }
        sum += v;
      }
      if (!Number.isNaN(sum)) total = (total ?? 0) + sum;
    }
    return total;
  });
}

/** Sum of the recorded values. */
export const sumRecorded = (vs: Value[]) => vs.reduce<number>((a, v) => a + (v ?? 0), 0);
/** Count of null values. */
export const countMissing = (vs: Value[]) => vs.filter((v) => v === null).length;

/**
 * Removes the seasonal cycle from a quarterly series. `mode` "diff" gives the
 * departure from that quarter's mean (for ocean values); "ratio" gives the
 * percent departure (for landings, whose seasonality scales with size).
 * Annual periods are returned unchanged.
 */
export function deseason<T extends Value>(values: T[], per: Period[], mode: "diff" | "ratio"): T[] {
  if (!per.length || per[0].q === undefined) return values;
  const qMean = [1, 2, 3, 4].map((q) => {
    const vs = values.filter((v, i) => per[i].q === q && v !== null) as number[];
    return vs.length ? mean(vs) : 0;
  });
  return values.map((v, i) => {
    if (v === null) return v;
    const m = qMean[per[i].q! - 1];
    return (mode === "diff" ? v - m : m ? (v / m - 1) * 100 : 0) as T;
  });
}

/** Seasonally adjusted values on the original scale (for trend lines). */
export function seasonallyAdjusted<T extends Value>(values: T[], per: Period[]): T[] {
  if (!per.length || per[0].q === undefined) return values;
  const known = values.filter((v) => v !== null) as number[];
  const overall = known.length ? mean(known) : 0;
  return deseason(values, per, "diff").map((d) => (d === null ? d : ((d as number) + overall) as T));
}

/** Periods per year at a resolution, for converting slopes to per-decade. */
export const perYear = (r: Resolution) => (r === "quarterly" ? 4 : 1);
