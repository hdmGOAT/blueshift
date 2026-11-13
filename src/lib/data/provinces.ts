// The provinces of Mindanao, grouped by region. Names match `properties.name`
// in src/data/mindanao.json. Not listed: Isabela City (an independent city)
// and the BARMM Special Geographic Area (no fisheries reporting).
//
// `marine` / `inland` only drive the sample-data generator (relative size of
// sea vs freshwater/pond production). Real PSA data replaces them.
import type { AreaId, Province, RegionId, Scope } from "./types";
import { REGIONS, REGION_BY_ID } from "./regions";

const P = (name: string, region: RegionId, marine: number, inland: number): Province => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, "-"),
  name,
  region,
  coastal: marine > 0,
  marine,
  inland,
});

export const PROVINCES: Province[] = [
  P("Zamboanga del Norte", "ix", 1.0, 0.3),
  P("Zamboanga del Sur", "ix", 1.2, 0.5),
  P("Zamboanga Sibugay", "ix", 0.9, 0.4),
  P("Sulu", "ix", 0.9, 0.05),
  P("Bukidnon", "x", 0, 1.0),
  P("Camiguin", "x", 0.3, 0.05),
  P("Lanao del Norte", "x", 0.8, 0.5),
  P("Misamis Occidental", "x", 0.8, 0.5),
  P("Misamis Oriental", "x", 1.0, 0.4),
  P("Davao del Norte", "xi", 0.8, 0.6),
  P("Davao del Sur", "xi", 0.9, 0.5),
  P("Davao Oriental", "xi", 1.0, 0.2),
  P("Davao de Oro", "xi", 0.5, 0.4),
  P("Davao Occidental", "xi", 0.8, 0.1),
  P("Cotabato", "xii", 0, 1.0),
  P("South Cotabato", "xii", 1.2, 0.6),
  P("Sultan Kudarat", "xii", 0.6, 0.5),
  P("Sarangani", "xii", 0.9, 0.3),
  P("Agusan del Norte", "xiii", 0.6, 0.5),
  P("Agusan del Sur", "xiii", 0, 1.0),
  P("Surigao del Norte", "xiii", 1.0, 0.3),
  P("Surigao del Sur", "xiii", 1.0, 0.4),
  P("Dinagat Islands", "xiii", 0.5, 0.05),
  P("Basilan", "barmm", 0.6, 0.1),
  P("Lanao del Sur", "barmm", 0, 1.0),
  P("Tawi-Tawi", "barmm", 1.2, 0.1),
  P("Maguindanao del Norte", "barmm", 0.6, 0.6),
  P("Maguindanao del Sur", "barmm", 0.2, 0.8),
];

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
  return [PROVINCE_BY_ID[a]];
}

/** Every selectable area, grouped for a <select>: Mindanao, then each region with its provinces. */
export const AREA_GROUPS = REGIONS.map((r) => ({ region: r, provinces: provincesOf(r.id) }));
