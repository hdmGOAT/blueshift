// SAMPLE DATA: quarterly fish landings (tonnes) per scope, province and species.
// Replace with PSA statistics from the backend; keep the YIELDS and
// PROVINCE_YIELDS shapes. "all" is the sum of the six regions, and each region
// is the sum of its provinces.
import { OCEAN } from "./ocean";
import { gauss, mulberry32 } from "./random";
import { PROVINCE_BY_ID, isRegion, provincesOf } from "./provinces";
import { REGIONS, SCOPES } from "./regions";
import { SPECIES } from "./species";
import { QUARTERS } from "./time";
import type { AreaId, Habitat, MixRow, Province, RegionId, Scope, Species, YieldPoint } from "./types";

/** Seasonal multiplier per quarter (Q1..Q4). Also used to de-season in stats.ts. */
export const HABITAT_SEASON: Record<Habitat, number[]> = {
  Pelagic: [0.92, 0.98, 1.06, 1.04],
  Reef: [1.04, 1.0, 0.95, 1.01],
  Aquaculture: [0.9, 1.02, 1.1, 0.98],
  Freshwater: [0.98, 1.0, 1.03, 0.99],
};

const BY_REGION = Object.fromEntries(
  REGIONS.map((r, ri) => [
    r.id,
    Object.fromEntries(
      SPECIES.map((s, si) => {
        const rand = mulberry32(100 + si * 13 + ri * 101);
        const sens = 0.55 + rand() * 0.9; // regional response varies
        const trend = s.trend * (0.6 + rand() * 0.8);
        const base = s.base * s.shares[ri];
        const pts = QUARTERS.map(({ index, q }) => {
          const o = OCEAN[r.id][index];
          const effect = 1 + s.sstSens * sens * o.sstAnom * 1.1 + s.chlSens * sens * (o.chlAnom / 0.03) * 0.12;
          const value = base * HABITAT_SEASON[s.habitat][q - 1] * (1 + trend * (index / 4)) * effect * (1 + gauss(rand) * 0.08);
          return { index, value };
        });
        return [s.id, pts];
      }),
    ),
  ]),
) as Record<RegionId, Record<string, YieldPoint[]>>;

const ALL: Record<string, YieldPoint[]> = Object.fromEntries(
  SPECIES.map((s) => [
    s.id,
    QUARTERS.map(({ index }) => ({ index, value: REGIONS.reduce((a, r) => a + BY_REGION[r.id][s.id][index].value, 0) })),
  ]),
);

/** YIELDS[scope][speciesId][quarterIndex] */
export const YIELDS: Record<Scope, Record<string, YieldPoint[]>> = { all: ALL, ...BY_REGION };

// ---- Provinces: each region's landings split across its provinces -----------

/** How much of a species a province lands, before noise: sea vs pond/inland. */
function provinceWeight(p: Province, s: Species) {
  if (s.habitat === "Freshwater") return p.inland;
  if (s.habitat === "Aquaculture") return 0.5 * p.marine + 0.5 * p.inland;
  return p.marine;
}

const BY_PROVINCE: Record<string, Record<string, YieldPoint[]>> = {};
REGIONS.forEach((r, ri) => {
  const provs = provincesOf(r.id);
  SPECIES.forEach((s, si) => {
    const rand = mulberry32(900 + ri * 211 + si * 17);
    // Each province has its own affinity for a species and a slow drift.
    const base = provs.map((p) => provinceWeight(p, s) * (0.6 + rand() * 0.8));
    const drift = provs.map(() => (rand() - 0.5) * 0.05);
    const series = provs.map(() => [] as YieldPoint[]);
    for (const { index } of QUARTERS) {
      const w = base.map((b, pi) => b * Math.max(0.05, 1 + drift[pi] * (index / 4) + gauss(rand) * 0.06));
      const sum = w.reduce((a, b) => a + b, 0) || 1;
      const total = BY_REGION[r.id][s.id][index].value;
      w.forEach((wi, pi) => series[pi].push({ index, value: (total * wi) / sum }));
    }
    provs.forEach((p, pi) => ((BY_PROVINCE[p.id] ??= {})[s.id] = series[pi]));
  });
});

/** PROVINCE_YIELDS[provinceId][speciesId][quarterIndex] */
export const PROVINCE_YIELDS = BY_PROVINCE;

/** Quarterly landings of one species in any area (Mindanao, region or province). */
export function areaYields(area: AreaId, speciesId: string): YieldPoint[] {
  if (area === "all" || isRegion(area)) return YIELDS[area as Scope][speciesId];
  if (!PROVINCE_BY_ID[area]) throw new Error(`Unknown area: ${area}`);
  return PROVINCE_YIELDS[area][speciesId];
}

/** Largest single-quarter value in each scope. Used to size map bubbles. */
export const scopeMax = Object.fromEntries(
  SCOPES.map((sc) => [sc, Math.max(...SPECIES.flatMap((s) => YIELDS[sc][s.id].map((p) => p.value)))]),
) as Record<Scope, number>;

export function annualTotal(scope: Scope, id: string, year: number) {
  return YIELDS[scope][id].filter((p) => QUARTERS[p.index].year === year).reduce((a, p) => a + p.value, 0);
}

const mixCache = new Map<string, MixRow[]>();
/** Every species landed in a scope for one quarter, largest first. Cached. */
export function catchMix(scope: Scope, index: number): MixRow[] {
  const key = `${scope}:${index}`;
  let mix = mixCache.get(key);
  if (!mix) {
    const rows = SPECIES.map((s) => ({ s, v: YIELDS[scope][s.id][index].value }));
    const total = rows.reduce((a, r) => a + r.v, 0);
    mix = rows.map((r) => ({ ...r, share: r.v / total })).sort((a, b) => b.v - a.v);
    mixCache.set(key, mix);
  }
  return mix;
}

/** Ids of the top-n species in a scope by 2025 landings. */
export function topSpecies(scope: Scope, n = 10): string[] {
  return [...SPECIES]
    .sort((a, b) => annualTotal(scope, b.id, 2025) - annualTotal(scope, a.id, 2025))
    .slice(0, n)
    .map((s) => s.id);
}
