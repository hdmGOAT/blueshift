// Regional Insights: environment and fisheries side by side for every province
// and region, with simple flags for potential areas of concern.
// Served by /api/regional.
import { PROVINCES, REGIONS, REGION_BY_ID, type Layer } from "@/lib/data";
import type { RegionalParams } from "./params";
import { countMissing, envSeries, periods, seasonallyAdjusted, sumRecorded, yieldSeries } from "./series";
import { mean } from "./stats";
import { fittedChange } from "./trend";

/** Thresholds for "worrying" ocean change, per decade. */
export const ENV_ALERT: Record<Layer, number> = { sst: 0.15, chl: -0.04 };
/** Landings falling by more than this percent over the range is a decline. */
export const DECLINE_PCT = -10;
/** Landings falling by more than this percent is flagged on its own. */
export const SHARP_DECLINE_PCT = -20;

export type AreaRow = {
  id: string;
  name: string;
  /** Region id (regions point to themselves). */
  region: string;
  envMean: number;
  /** Seasonally adjusted change per decade. */
  envPerDecade: number;
  /** Sum of recorded landings. */
  yieldTotal: number;
  /** Quarters with no recorded landings for the selection. */
  missing: number;
  /** Fitted percent change in landings over the range. */
  yieldChangePct: number | null;
  /** Quarterly landings, for comparison charts (null = not recorded). */
  yieldSeries: (number | null)[];
  envSeries: number[];
  concern: string | null;
};

export type RegionalSummary = {
  params: RegionalParams;
  labels: string[];
  provinces: AreaRow[];
  regions: AreaRow[];
};

const worrying = (v: Layer, perDecade: number) => (v === "sst" ? perDecade > ENV_ALERT.sst : perDecade < ENV_ALERT.chl);

function concernFor(v: Layer, envPerDecade: number, yieldPct: number | null) {
  const envBad = worrying(v, envPerDecade);
  const declining = yieldPct !== null && yieldPct < DECLINE_PCT;
  const envText = v === "sst" ? "warming waters" : "falling chlorophyll-a";
  if (envBad && declining) return `${envText} and declining landings`;
  if (yieldPct !== null && yieldPct < SHARP_DECLINE_PCT) return "sharply declining landings";
  return null;
}

export function regionalSummary(params: RegionalParams): RegionalSummary {
  const { from, to, variable, species } = params;
  const per = periods("quarterly", from, to);

  const row = (id: string, name: string, region: string): AreaRow => {
    const env = envSeries(id, variable, per);
    const yld = yieldSeries(id, species, per);
    const envPerDecade = fittedChange(seasonallyAdjusted(env, per), 4).perDecade;
    const yieldChangePct = fittedChange(seasonallyAdjusted(yld, per), 4).pct;
    return {
      id, name, region,
      envMean: mean(env),
      envPerDecade,
      yieldTotal: sumRecorded(yld),
      missing: countMissing(yld),
      yieldChangePct,
      yieldSeries: yld,
      envSeries: env,
      concern: concernFor(variable, envPerDecade, yieldChangePct),
    };
  };

  return {
    params,
    labels: per.map((p) => p.label),
    provinces: PROVINCES.map((p) => row(p.id, p.name, p.region)),
    regions: REGIONS.map((r) => row(r.id, REGION_BY_ID[r.id].name, r.id)),
  };
}
