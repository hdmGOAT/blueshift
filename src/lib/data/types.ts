// Shared data types. Every other data module and the UI import from here
// (through "@/lib/data").

/** A province. `id` is a slug of the name used in src/data/mindanao.json. */
export type Province = {
  id: string;
  name: string;
  region: RegionId;
  /** False for landlocked provinces: their ocean values are their region's waters. */
  coastal: boolean;
  /** Sample-data generator inputs: relative size of marine and inland/pond fisheries. */
  marine: number;
  inland: number;
};

/**
 * Any area the filters can select: "all" (Mindanao), a region id or a
 * province id. Region and province ids never collide.
 */
export type AreaId = string;

/** Which satellite variable the map and charts are showing. */
export type Layer = "sst" | "chl";

export type RegionId = "ix" | "x" | "xi" | "xii" | "xiii" | "barmm";

/** A region, or "all" for the whole of Mindanao. */
export type Scope = "all" | RegionId;

export type Region = {
  id: RegionId;
  name: string;
  /** Roman-numeral label used on the map, e.g. "IX". */
  short: string;
  /** PSGC code, matches `properties.region` in src/data/mindanao.json. */
  psgc: number;
  /** Chart colour for this region. */
  color: string;
};

/** A sea name printed on the map. */
export type SeaLabel = { id: string; name: string; lon: number; lat: number; anchor?: "start" | "end" };

export type Habitat = "Pelagic" | "Reef" | "Aquaculture" | "Freshwater";

export type Species = {
  id: string;
  local: string;
  english: string;
  scientific: string;
  habitat: Habitat;
  /** Sample-data generator inputs. Not needed once real data is wired in. */
  base: number; // tonnes per quarter, all Mindanao
  shares: number[]; // share of catch by region, in REGIONS order
  sstSens: number;
  chlSens: number;
  trend: number; // fractional change per year
};

export type Quarter = { index: number; year: number; q: number };

/** Ocean conditions for one quarter. `*Anom` is the departure from normal. */
export type OceanPoint = { index: number; sst: number; sstAnom: number; chl: number; chlAnom: number };

/** Landings for one quarter, in tonnes. */
export type YieldPoint = { index: number; value: number };

/** Pearson r between landings and each ocean variable. */
export type Corr = { sst: number; chl: number };

/** One species' slice of a scope's catch in one quarter. */
export type MixRow = { s: Species; v: number; share: number };
