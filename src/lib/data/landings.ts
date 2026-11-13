// Quarterly fish landings (tonnes): observed per province and species (from
// the data file, null where not recorded). Regions and Mindanao are the sum of
// the RECORDED provincial values, so a gap lowers a total rather than hiding it;
// the UI and Methodology say so.
import { OBS } from "./observations";
import { PROVINCES, PROVINCE_BY_ID, isRegion, provincesOf } from "./provinces";
import { REGIONS, SCOPES } from "./regions";
import { SPECIES } from "./species";
import { LAST_COMPLETE_YEAR, QUARTERS } from "./time";
import type { AreaId, MixRow, ObsPoint, RegionId, Scope, YieldPoint } from "./types";

/** PROVINCE_YIELDS[provinceId][speciesId][quarterIndex]; value null = not recorded. */
export const PROVINCE_YIELDS: Record<string, Record<string, ObsPoint[]>> = Object.fromEntries(
  PROVINCES.map((p) => [p.id, Object.fromEntries(SPECIES.map((s) => [s.id, OBS.yields[p.name][s.id].map((value, index) => ({ index, value }))]))]),
);

const summed = (ids: string[], speciesId: string): YieldPoint[] =>
  QUARTERS.map(({ index }) => ({ index, value: ids.reduce((a, id) => a + (PROVINCE_YIELDS[id][speciesId][index].value ?? 0), 0) }));

/** YIELDS[scope][speciesId][quarterIndex]: recorded landings summed over the scope's provinces. */
export const YIELDS: Record<Scope, Record<string, YieldPoint[]>> = {
  all: Object.fromEntries(SPECIES.map((s) => [s.id, summed(PROVINCES.map((p) => p.id), s.id)])),
  ...(Object.fromEntries(REGIONS.map((r) => [r.id, Object.fromEntries(SPECIES.map((s) => [s.id, summed(provincesOf(r.id).map((p) => p.id), s.id)]))])) as Record<RegionId, Record<string, YieldPoint[]>>),
};

/** Quarterly landings of one species in any area. Province values may be null (not recorded). */
export function areaYields(area: AreaId, speciesId: string): ObsPoint[] {
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
    const total = rows.reduce((a, r) => a + r.v, 0) || 1;
    mix = rows.map((r) => ({ ...r, share: r.v / total })).sort((a, b) => b.v - a.v);
    mixCache.set(key, mix);
  }
  return mix;
}

/** Ids of the top-n species in a scope by landings over the last three complete years. */
export function topSpecies(scope: Scope, n = 10): string[] {
  const recent = (id: string) => [0, 1, 2].reduce((a, k) => a + annualTotal(scope, id, LAST_COMPLETE_YEAR - k), 0);
  return [...SPECIES]
    .sort((a, b) => recent(b.id) - recent(a.id))
    .slice(0, n)
    .map((s) => s.id);
}
