// The six Mindanao regions and the sea names shown on the map.
import type { Region, RegionId, Scope, SeaLabel } from "./types";

export const REGIONS: Region[] = [
  { id: "ix", name: "Zamboanga Peninsula", short: "IX", psgc: 900000000, color: "#1282a2" },
  { id: "x", name: "Northern Mindanao", short: "X", psgc: 1000000000, color: "#5cc0dc" },
  { id: "xi", name: "Davao Region", short: "XI", psgc: 1100000000, color: "#a9dbe7" },
  { id: "xii", name: "SOCCSKSARGEN", short: "XII", psgc: 1200000000, color: "#e8b85c" },
  { id: "xiii", name: "Caraga", short: "XIII", psgc: 1600000000, color: "#ef8a6a" },
  { id: "barmm", name: "BARMM", short: "BARMM", psgc: 1900000000, color: "#8fa9d6" },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, Region>;
export const REGION_BY_PSGC = Object.fromEntries(REGIONS.map((r) => [r.psgc, r.id])) as Record<number, RegionId>;

/** "all" followed by every region id. */
export const SCOPES: Scope[] = ["all", ...REGIONS.map((r) => r.id)];

export const regionName = (s: Scope) => (s === "all" ? "All Mindanao" : REGION_BY_ID[s].name);

export const SEAS: SeaLabel[] = [
  { id: "sulu", name: "Sulu Sea", lon: 121.6, lat: 8.2 },
  { id: "moro", name: "Moro Gulf", lon: 123.3, lat: 6.7 },
  { id: "davao", name: "Davao Gulf", lon: 125.72, lat: 6.75 },
  { id: "bohol", name: "Bohol Sea", lon: 124.45, lat: 9.15 },
  { id: "phsea", name: "Philippine Sea", lon: 126.9, lat: 10.15, anchor: "end" },
  { id: "celebes", name: "Celebes Sea", lon: 124.4, lat: 5.35 },
];
