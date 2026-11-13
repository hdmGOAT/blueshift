// Correlation between landings and ocean conditions, per scope and species,
// for the Overview (bubble colours, correlation card, key finding).
// Landings are seasonally adjusted (divided by each quarter-of-year's mean) and
// de-trended, then correlated with the ocean anomalies, so the score reflects
// ocean conditions rather than the seasons or long-term drift.
// The Relationship Explorer runs its own, configurable analysis via /api/analysis.
import { YIELDS } from "./landings";
import { OCEAN } from "./ocean";
import { SCOPES } from "./regions";
import { SPECIES } from "./species";
import type { Corr, OceanPoint, Scope, YieldPoint } from "./types";

export function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

function correlate(ys: YieldPoint[], ocean: OceanPoint[]): Corr {
  const qMean = [0, 1, 2, 3].map((q) => {
    const v = ys.filter((p) => p.index % 4 === q).map((p) => p.value);
    return v.reduce((a, b) => a + b, 0) / v.length || 1;
  });
  const adj = ys.map((p) => p.value / qMean[p.index % 4]);
  const n = adj.length;
  const xm = (n - 1) / 2;
  const ym = adj.reduce((x, y) => x + y, 0) / n;
  const slope = adj.reduce((acc, y, i) => acc + (i - xm) * (y - ym), 0) / adj.reduce((acc, _, i) => acc + (i - xm) ** 2, 0);
  const resid = adj.map((y, i) => y - (ym + slope * (i - xm)));
  return { sst: pearson(resid, ocean.map((o) => o.sstAnom)), chl: pearson(resid, ocean.map((o) => o.chlAnom)) };
}

/** CORRELATION[scope][speciesId] */
export const CORRELATION = Object.fromEntries(
  SCOPES.map((sc) => [sc, Object.fromEntries(SPECIES.map((s) => [s.id, correlate(YIELDS[sc][s.id], OCEAN[sc])]))]),
) as Record<Scope, Record<string, Corr>>;

/** Plain-language strength of a correlation, e.g. "Strong negative". */
export function strengthLabel(r: number) {
  const a = Math.abs(r);
  const dir = r < 0 ? "negative" : "positive";
  if (a < 0.2) return "No clear link";
  if (a < 0.4) return `Weak ${dir}`;
  if (a < 0.6) return `Moderate ${dir}`;
  return `Strong ${dir}`;
}
