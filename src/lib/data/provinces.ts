// The provinces with observations, grouped by region. The list comes from the
// data file; REGION_OF says which region each one belongs to (names match
// `properties.name` in src/data/mindanao.json). Bukidnon, Cotabato, Agusan del
// Sur and Maguindanao del Sur have no rows in the data; they appear on maps
// as plain land and are not part of any total.
import { OBS } from "./observations";
import { REGIONS, REGION_BY_ID } from "./regions";
import type { AreaId, Province, RegionId, Scope } from "./types";

const REGION_OF: Record<string, RegionId> = {
  "Zamboanga del Norte": "ix", "Zamboanga del Sur": "ix", "Zamboanga Sibugay": "ix", Sulu: "ix",
  Bukidnon: "x", Camiguin: "x", "Lanao del Norte": "x", "Misamis Occidental": "x", "Misamis Oriental": "x",
  "Davao del Norte": "xi", "Davao del Sur": "xi", "Davao Oriental": "xi", "Davao de Oro": "xi", "Davao Occidental": "xi",
  Cotabato: "xii", "South Cotabato": "xii", "Sultan Kudarat": "xii", Sarangani: "xii",
  "Agusan del Norte": "xiii", "Agusan del Sur": "xiii", "Surigao del Norte": "xiii", "Surigao del Sur": "xiii", "Dinagat Islands": "xiii",
  Basilan: "barmm", "Lanao del Sur": "barmm", "Tawi-Tawi": "barmm", "Maguindanao del Norte": "barmm", "Maguindanao del Sur": "barmm",
};

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");
const regionOrder = (r: RegionId) => REGIONS.findIndex((x) => x.id === r);

export const PROVINCES: Province[] = OBS.meta.provinces
  .map((name) => {
    const region = REGION_OF[name];
    if (!region) throw new Error(`Province "${name}" in the data has no region in provinces.ts`);
    return { id: slug(name), name, region, lonLat: OBS.centroids[name] };
  })
  .sort((a, b) => regionOrder(a.region) - regionOrder(b.region) || a.name.localeCompare(b.name));

export const PROVINCE_BY_ID = Object.fromEntries(PROVINCES.map((p) => [p.id, p])) as Record<string, Province>;
export const PROVINCE_BY_NAME = Object.fromEntries(PROVINCES.map((p) => [p.name, p])) as Record<string, Province>;

export const provincesOf = (region: RegionId) => PROVINCES.filter((p) => p.region === region);

// ---- Areas: Mindanao, a region, or a province --------------------------------

export const isRegion = (a: AreaId): a is RegionId => a in REGION_BY_ID;
export const isProvince = (a: AreaId) => a in PROVINCE_BY_ID;
export const isArea = (a: string): a is AreaId => a === "all" || isRegion(a) || isProvince(a);

export function areaName(a: AreaId) {
  if (a === "all") return "All Mindanao";
  if (isRegion(a)) return REGION_BY_ID[a].name;
  return PROVINCE_BY_ID[a]?.name ?? a;
}

/** The region-level scope an area sits in ("all" stays "all"). */
export const areaScope = (a: AreaId): Scope => (a === "all" ? "all" : isRegion(a) ? a : PROVINCE_BY_ID[a].region);

/** The provinces that make up an area (a province is its own only member). */
export function areaProvinces(a: AreaId): Province[] {
  if (a === "all") return PROVINCES;
  if (isRegion(a)) return provincesOf(a);
  return PROVINCE_BY_ID[a] ? [PROVINCE_BY_ID[a]] : [];
}

/** Every selectable area, grouped for a <select>: each region with its provinces. */
export const AREA_GROUPS = REGIONS.map((r) => ({ region: r, provinces: provincesOf(r.id) }));
