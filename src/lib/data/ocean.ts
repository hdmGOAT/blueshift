// Quarterly sea-surface temperature and chlorophyll-a: observed per province
// (from the data file), averaged with equal weight for regions and Mindanao.
// Anomalies (`*Anom`) are departures from the same quarter's mean over BASELINE.
import { OBS } from "./observations";
import { PROVINCES, PROVINCE_BY_ID, isRegion, provincesOf } from "./provinces";
import { REGIONS } from "./regions";
import { BASELINE, QUARTERS, quartersIn } from "./time";
import type { AreaId, OceanPoint, RegionId, Scope } from "./types";

const BASE_Q = quartersIn(BASELINE.from, BASELINE.to);

/** Adds anomalies vs each quarter-of-year's baseline mean. */
function withAnomalies(sst: number[], chl: number[]): OceanPoint[] {
  const normal = (v: number[], q: number) => {
    const xs = BASE_Q.filter((i) => i % 4 === q).map((i) => v[i]);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  const sstN = [0, 1, 2, 3].map((q) => normal(sst, q));
  const chlN = [0, 1, 2, 3].map((q) => normal(chl, q));
  return QUARTERS.map(({ index }) => ({ index, sst: sst[index], sstAnom: sst[index] - sstN[index % 4], chl: chl[index], chlAnom: chl[index] - chlN[index % 4] }));
}

const meanOf = (names: string[], key: "sst" | "chl") => QUARTERS.map(({ index }) => names.reduce((a, n) => a + OBS[key][n][index], 0) / names.length);
const averaged = (names: string[]) => withAnomalies(meanOf(names, "sst"), meanOf(names, "chl"));

/** PROVINCE_OCEAN[provinceId][quarterIndex] */
export const PROVINCE_OCEAN: Record<string, OceanPoint[]> = Object.fromEntries(PROVINCES.map((p) => [p.id, withAnomalies(OBS.sst[p.name], OBS.chl[p.name])]));

/** OCEAN[scope][quarterIndex] */
export const OCEAN: Record<Scope, OceanPoint[]> = {
  all: averaged(PROVINCES.map((p) => p.name)),
  ...(Object.fromEntries(REGIONS.map((r) => [r.id, averaged(provincesOf(r.id).map((p) => p.name))])) as Record<RegionId, OceanPoint[]>),
};

/** Quarterly ocean conditions for any area (Mindanao, region or province). */
export function areaOcean(area: AreaId): OceanPoint[] {
  if (area === "all" || isRegion(area)) return OCEAN[area as Scope];
  if (!PROVINCE_BY_ID[area]) throw new Error(`Unknown area: ${area}`);
  return PROVINCE_OCEAN[area];
}

/** Mean of one field over a range of quarters [from, to). */
export function oceanMean(scope: Scope, key: keyof Omit<OceanPoint, "index">, from: number, to: number) {
  const pts = OCEAN[scope].slice(from, to);
  return pts.reduce((a, o) => a + o[key], 0) / pts.length;
}
