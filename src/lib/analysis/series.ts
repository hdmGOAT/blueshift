// Turns the quarterly data into period series (quarters or years) for any
// area, species set and year range. Every summary and the analysis build on this.
import { COMPLETE_YEARS, QUARTERS, SPECIES, areaOcean, areaYields, quarterLabel, quartersIn, type AreaId, type Layer } from "@/lib/data";
import { mean } from "./stats";
import type { Resolution } from "./params";

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

/** Mean ocean value per period. */
export function envSeries(area: AreaId, variable: Layer, per: Period[]) {
  const ocean = areaOcean(area);
  return per.map((p) => mean(p.quarters.map((i) => ocean[i][variable])));
}

/** Total landings per period, summed over the species (empty = all species). */
export function yieldSeries(area: AreaId, speciesIds: string[], per: Period[]) {
  const ids = speciesIds.length ? speciesIds : SPECIES.map((s) => s.id);
  const series = ids.map((id) => areaYields(area, id));
  return per.map((p) => p.quarters.reduce((acc, i) => acc + series.reduce((a, ys) => a + ys[i].value, 0), 0));
}

/**
 * Removes the seasonal cycle from a quarterly series. `mode` "diff" gives the
 * departure from that quarter's mean (for ocean values); "ratio" gives the
 * percent departure (for landings, whose seasonality scales with size).
 * Annual periods are returned unchanged.
 */
export function deseason(values: number[], per: Period[], mode: "diff" | "ratio") {
  if (!per.length || per[0].q === undefined) return values;
  const qMean = [1, 2, 3, 4].map((q) => {
    const vs = values.filter((_, i) => per[i].q === q);
    return vs.length ? mean(vs) : 0;
  });
  return values.map((v, i) => {
    const m = qMean[per[i].q! - 1];
    return mode === "diff" ? v - m : m ? (v / m - 1) * 100 : 0;
  });
}

/** Seasonally adjusted values on the original scale (for trend lines). */
export function seasonallyAdjusted(values: number[], per: Period[]) {
  if (!per.length || per[0].q === undefined) return values;
  const overall = mean(values);
  return deseason(values, per, "diff").map((d) => d + overall);
}

/** Periods per year at a resolution, for converting slopes to per-decade. */
export const perYear = (r: Resolution) => (r === "quarterly" ? 4 : 1);
