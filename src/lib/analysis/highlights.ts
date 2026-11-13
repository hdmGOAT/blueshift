// Searches every species × area × ocean variable × lag for the strongest
// relationships, using the Explorer's default method (quarterly, seasonal
// cycle removed, no detrending), so a highlight opens to exactly the result
// listed, keeping the best lag of each species × area × variable. Served by /api/highlights; page.tsx uses the top one as the app's
// starting selection.
//
// Thousands of tests are run, so some will look significant by chance: every
// result carries a Benjamini-Hochberg q-value (false discovery rate) as well
// as its p-value, and results need MIN_N paired quarters to be considered.
import { PROVINCES, REGIONS, SPECIES, SPECIES_BY_ID, areaName, notesFor, type AreaId, type Layer } from "@/lib/data";
import { MAX_LAG, type AnalysisParams } from "./params";
import { adjustedSeries, lagStats } from "./relationship";
import { spearman } from "./stats";

/** Fewest paired quarters a combination needs to be ranked (about 10 years). */
export const MIN_N = 40;

export type Highlight = {
  /** Params that reproduce this result in the Explorer. */
  params: AnalysisParams;
  speciesName: string;
  areaName: string;
  r: number;
  rho: number;
  p: number;
  /** Benjamini-Hochberg adjusted p-value across every test in the search. */
  q: number;
  n: number;
  /** True when a known data issue affects this area and period (see notes.ts). */
  flagged: boolean;
};

export type HighlightsResult = { from: number; to: number; tests: number; significant: number; top: Highlight[] };

const AREAS: AreaId[] = ["all", ...REGIONS.map((r) => r.id), ...PROVINCES.map((p) => p.id)];
const VARIABLES: Layer[] = ["sst", "chl"];

/** Benjamini-Hochberg q-values, in the input order. */
export function bhQ(ps: number[]) {
  const order = ps.map((p, i) => [p, i] as const).sort((a, b) => a[0] - b[0]);
  const q = new Array<number>(ps.length);
  let min = 1;
  for (let k = order.length - 1; k >= 0; k--) {
    min = Math.min(min, (order[k][0] * ps.length) / (k + 1));
    q[order[k][1]] = min;
  }
  return q;
}

const cache = new Map<string, HighlightsResult>();

export function findHighlights({ from, to, limit = 12 }: { from: number; to: number; limit?: number }): HighlightsResult {
  const key = `${from}:${to}:${limit}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const tests: { params: AnalysisParams; r: number; p: number; n: number }[] = [];
  for (const species of SPECIES.map((s) => s.id))
    for (const area of AREAS)
      for (const variable of VARIABLES) {
        const base = { area, species, variable, resolution: "quarterly" as const, from, to, deseason: true, detrend: false };
        const { x, y, labels } = adjustedSeries(base);
        for (let lag = 0; lag <= MAX_LAG.quarterly; lag++) {
          const s = lagStats(x, y, labels, lag);
          if (s.n >= MIN_N) tests.push({ params: { ...base, lag }, r: s.r, p: s.p, n: s.n });
        }
      }

  const q = bhQ(tests.map((t) => t.p));
  const ranked = tests.map((t, i) => ({ ...t, q: q[i] })).sort((a, b) => a.p - b.p || Math.abs(b.r) - Math.abs(a.r));

  // One entry per species × area × variable: its best lag. Otherwise the same
  // relationship fills the list at several lags.
  const seen = new Set<string>();
  const distinct = ranked.filter((t) => {
    const k = `${t.params.species}|${t.params.area}|${t.params.variable}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const top = distinct.slice(0, limit).map((t) => {
    // Spearman only for the shown results (it needs the pairs again).
    const { x, y } = adjustedSeries(t.params);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = t.params.lag; i < y.length; i++) {
      const v = y[i];
      if (v !== null) {
        xs.push(x[i - t.params.lag]);
        ys.push(v);
      }
    }
    return {
      params: t.params,
      speciesName: SPECIES_BY_ID[t.params.species].local,
      areaName: areaName(t.params.area),
      r: t.r,
      rho: spearman(xs, ys),
      p: t.p,
      q: t.q,
      n: t.n,
      flagged: notesFor(t.params.area, from, to).length > 0,
    };
  });

  const result = { from, to, tests: tests.length, significant: ranked.filter((t) => t.q < 0.05).length, top };
  cache.set(key, result);
  return result;
}

/** The app's starting selection: the strongest result not affected by a known data issue. */
export function defaultHighlight(from: number, to: number) {
  const { top } = findHighlights({ from, to });
  return top.find((h) => !h.flagged) ?? top[0] ?? null;
}
