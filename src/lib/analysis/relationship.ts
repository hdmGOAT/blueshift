// The Relationship Explorer's analysis: how one ocean variable relates to one
// species' landings in one area, optionally lagged and adjusted. Served by
// /api/analysis; the UI only draws what this returns.
import { SPECIES_BY_ID, areaName, notesFor } from "@/lib/data";
import { interpret, type Interpretation } from "./interpret";
import { MAX_LAG, type AnalysisParams } from "./params";
import { countMissing, deseason as removeSeason, envSeries, periods, yieldSeries, type Value } from "./series";
import { correlationP, detrend, linreg, pearson, spearman } from "./stats";

/** Fewer pairs than this and no statistics are reported. */
export const MIN_PAIRS = 5;

export type Pair = { x: number; y: number; label: string; envLabel: string };
export type LagRow = { lag: number; r: number; p: number; n: number };

export type Stats = {
  pearson: number;
  spearman: number;
  /** Two-sided p-values for each coefficient. */
  pPearson: number;
  pSpearman: number;
  n: number;
  /** Fitted line through the scatter, in the scatter's units. */
  slope: number;
  intercept: number;
  r2: number;
};

export type AnalysisResult = {
  params: AnalysisParams;
  areaName: string;
  speciesName: string;
  /** Raw series over the period, for the two trend charts. `yield` null = not recorded. */
  trend: { label: string; env: number; yield: number | null }[];
  /** Periods in range with no recorded landings (skipped). */
  missing: number;
  /** What the scatter axes measure after adjustment. */
  units: { x: string; y: string };
  /** Adjustments actually applied (deseasoning needs two or more years). */
  applied: { deseason: boolean; detrend: boolean };
  pairs: Pair[];
  stats: Stats | null;
  lagProfile: LagRow[];
  interpretation: Interpretation;
};

const VAR_UNIT = { sst: "°C", chl: "mg/m³" } as const;
const VAR_NAME = { sst: "SST", chl: "Chl-a" } as const;

/** Pairs landings at i with the ocean at i - lag, skipping unrecorded landings. */
function pairUp(env: number[], yld: Value[], labels: string[], lag: number): Pair[] {
  const out: Pair[] = [];
  for (let i = lag; i < yld.length; i++) {
    const y = yld[i];
    if (y !== null) out.push({ x: env[i - lag], y, label: labels[i], envLabel: labels[i - lag] });
  }
  return out;
}

function statsFor(pairs: Pair[]): Stats | null {
  const n = pairs.length;
  if (n < MIN_PAIRS) return null;
  const x = pairs.map((p) => p.x);
  const y = pairs.map((p) => p.y);
  const r = pearson(x, y);
  const rho = spearman(x, y);
  const { slope, intercept } = linreg(x, y);
  return { pearson: r, spearman: rho, pPearson: correlationP(r, n), pSpearman: correlationP(rho, n), n, slope, intercept, r2: r * r };
}

/**
 * The two series the statistics run on, after the requested adjustments.
 * Shared by runAnalysis and the highlights search (highlights.ts).
 */
export function adjustedSeries(params: Omit<AnalysisParams, "lag">) {
  const { area, species, variable, resolution, from, to } = params;
  const per = periods(resolution, from, to);
  const env = envSeries(area, variable, per);
  const yld = yieldSeries(area, [species], per);
  const labels = per.map((p) => p.label);

  // Deseasoning compares each quarter with the same quarter in other years,
  // so it needs at least two years of data.
  const canDeseason = resolution === "quarterly" && to - from >= 1;
  const applied = { deseason: params.deseason && canDeseason, detrend: params.detrend };

  let x = applied.deseason ? removeSeason(env, per, "diff") : env;
  let y = applied.deseason ? removeSeason(yld, per, "ratio") : yld;
  if (applied.detrend) {
    x = detrend(x);
    y = detrend(y);
  }
  return { per, env, yld, labels, applied, x, y };
}

/** Pearson r, its p-value and n for one lag. */
export function lagStats(x: number[], y: Value[], labels: string[], lag: number): LagRow {
  const pl = pairUp(x, y, labels, lag);
  const r = pl.length >= MIN_PAIRS ? pearson(pl.map((p) => p.x), pl.map((p) => p.y)) : 0;
  return { lag, r, p: pl.length >= MIN_PAIRS ? correlationP(r, pl.length) : 1, n: pl.length };
}

export function runAnalysis(params: AnalysisParams): AnalysisResult {
  const { area, species, variable, resolution, from, to, lag } = params;
  const { per, env, yld, labels, applied, x, y } = adjustedSeries(params);

  const pairs = pairUp(x, y, labels, lag);
  const stats = statsFor(pairs);
  const lagProfile = Array.from({ length: MAX_LAG[resolution] + 1 }, (_, l) => lagStats(x, y, labels, l));

  const unitX = applied.deseason ? `${VAR_NAME[variable]} vs seasonal normal, ${VAR_UNIT[variable]}` : `${VAR_NAME[variable]}, ${VAR_UNIT[variable]}`;
  const unitY = applied.deseason ? "Landings vs seasonal normal, %" : "Landings, t";
  const units = { x: applied.detrend ? `${unitX} (detrended)` : unitX, y: applied.detrend ? `${unitY} (detrended)` : unitY };

  const sp = SPECIES_BY_ID[species];
  const result = {
    params,
    areaName: areaName(area),
    speciesName: sp.local,
    trend: per.map((p, i) => ({ label: p.label, env: env[i], yield: yld[i] })),
    missing: countMissing(yld),
    units,
    applied,
    pairs,
    stats,
    lagProfile,
  };
  return {
    ...result,
    interpretation: interpret({
      ...result,
      requestedDeseason: params.deseason,
      periods: per.length,
      notes: notesFor(area, from, to).map((n) => n.text),
    }),
  };
}
