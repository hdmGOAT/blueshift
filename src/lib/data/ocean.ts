// SAMPLE DATA: quarterly sea-surface temperature and chlorophyll-a per scope
// and province. Replace with NASA MODIS-Aqua series (averaged over each area's
// coastal waters) from the backend; keep the OCEAN and PROVINCE_OCEAN shapes.
import { gauss, mulberry32 } from "./random";
import { PROVINCES, PROVINCE_BY_ID, isRegion } from "./provinces";
import { REGIONS } from "./regions";
import { QUARTERS } from "./time";
import type { AreaId, OceanPoint, RegionId, Scope } from "./types";

// ENSO-like signal: warm 2016, 2019-20 mild, 2023-24 strong, cooling after.
const enso = (t: number) =>
  0.35 * Math.exp(-((t - 0.3) ** 2) / 0.4) +
  0.15 * Math.exp(-((t - 3.8) ** 2) / 0.5) +
  -0.18 * Math.exp(-((t - 5.6) ** 2) / 0.8) +
  0.42 * Math.exp(-((t - 7.9) ** 2) / 0.45) +
  0.05 * Math.sin(t * 2.1);

const SST_SEASON = [-0.55, 0.45, 0.35, -0.25];
const CHL_SEASON = [0.06, -0.05, 0.03, 0.05];

const oceanRand = mulberry32(7);
const OCEAN_ALL: OceanPoint[] = QUARTERS.map(({ index, q }) => {
  const t = index / 4;
  const anomaly = 0.026 * t + enso(t) + gauss(oceanRand) * 0.05 - 0.12;
  const chlAnom = -0.006 * t - 0.09 * enso(t) + gauss(oceanRand) * 0.012;
  return { index, sst: 29.05 + SST_SEASON[q - 1] + anomaly, sstAnom: anomaly, chl: 0.21 + CHL_SEASON[q - 1] + chlAnom, chlAnom };
});

// Each region's coastal waters: same basin signal, own offset and response.
const REGION_PARAMS: Record<RegionId, { sst: number; amp: number; chl: number }> = {
  ix: { sst: 0.12, amp: 1.05, chl: 0.07 },
  x: { sst: -0.08, amp: 0.9, chl: 0.05 },
  xi: { sst: 0.05, amp: 1.1, chl: 0.04 },
  xii: { sst: 0.15, amp: 1.15, chl: -0.02 },
  xiii: { sst: -0.22, amp: 0.85, chl: 0.01 },
  barmm: { sst: 0.2, amp: 1.0, chl: -0.03 },
};

const BY_REGION = Object.fromEntries(
  REGIONS.map((r, ri) => {
    const p = REGION_PARAMS[r.id];
    const rand = mulberry32(40 + ri * 7);
    return [
      r.id,
      OCEAN_ALL.map((o) => {
        const sstAnom = o.sstAnom * p.amp + gauss(rand) * 0.04;
        const chlAnom = o.chlAnom * p.amp + gauss(rand) * 0.006;
        return { index: o.index, sst: o.sst - o.sstAnom + sstAnom + p.sst, sstAnom, chl: o.chl - o.chlAnom + chlAnom + p.chl, chlAnom };
      }),
    ];
  }),
) as Record<RegionId, OceanPoint[]>;

/** OCEAN[scope][quarterIndex] */
export const OCEAN: Record<Scope, OceanPoint[]> = { all: OCEAN_ALL, ...BY_REGION };

// Provinces: their region's waters plus a local offset. Landlocked provinces
// have no coastline, so they report their region's waters unchanged.
export const PROVINCE_OCEAN: Record<string, OceanPoint[]> = Object.fromEntries(
  PROVINCES.map((p, pi) => {
    const region = BY_REGION[p.region];
    if (!p.coastal) return [p.id, region];
    const rand = mulberry32(300 + pi * 31);
    const dSst = (rand() - 0.5) * 0.3;
    const dChl = (rand() - 0.5) * 0.06;
    return [
      p.id,
      region.map((o) => {
        const sstAnom = o.sstAnom + gauss(rand) * 0.035;
        const chlAnom = o.chlAnom + gauss(rand) * 0.005;
        return { index: o.index, sst: o.sst - o.sstAnom + sstAnom + dSst, sstAnom, chl: Math.max(0.03, o.chl - o.chlAnom + chlAnom + dChl), chlAnom };
      }),
    ];
  }),
);

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
