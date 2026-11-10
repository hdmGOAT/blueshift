// Correlation between landings and ocean conditions.
// SAMPLE: computed in the browser here; the backend will supply these scores.
import { HABITAT_SEASON, YIELDS } from "./landings";
import { OCEAN } from "./ocean";
import { SCOPES } from "./regions";
import { SPECIES } from "./species";
import { LAST_OBSERVED, QUARTERS } from "./time";
import type { Corr, OceanPoint, Scope, Species, YieldPoint } from "./types";

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
  return num / Math.sqrt(da * db);
}

// Uses observed quarters only, on seasonally adjusted and de-trended landings,
// so the score reflects ocean conditions rather than season or long-term drift.
function correlate(s: Species, ys: YieldPoint[], ocean: OceanPoint[]): Corr {
  const obs = ys.slice(0, LAST_OBSERVED + 1);
  const adj = obs.map((p) => p.value / HABITAT_SEASON[s.habitat][QUARTERS[p.index].q - 1]);
  const n = adj.length;
  const xm = (n - 1) / 2;
  const ym = adj.reduce((x, y) => x + y, 0) / n;
  const slope = adj.reduce((acc, y, i) => acc + (i - xm) * (y - ym), 0) / adj.reduce((acc, _, i) => acc + (i - xm) ** 2, 0);
  const resid = adj.map((y, i) => y - (ym + slope * (i - xm)));
  return {
    sst: pearson(resid, ocean.slice(0, n).map((o) => o.sstAnom)),
    chl: pearson(resid, ocean.slice(0, n).map((o) => o.chlAnom)),
  };
}

/** CORRELATION[scope][speciesId] */
export const CORRELATION = Object.fromEntries(
  SCOPES.map((sc) => [sc, Object.fromEntries(SPECIES.map((s) => [s.id, correlate(s, YIELDS[sc][s.id], OCEAN[sc])]))]),
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
