// Sample data for the BlueShift prototype.
// Values are generated deterministically so the UI behaves like the real thing;
// swap these out for the FastAPI responses once the backend is live.

export type Layer = "sst" | "chl";

// ---- Regions ---------------------------------------------------------------

export type RegionId = "ix" | "x" | "xi" | "xii" | "xiii" | "barmm";
export type Scope = "all" | RegionId;

export type Region = { id: RegionId; name: string; short: string; psgc: number; color: string };

export const REGIONS: Region[] = [
  { id: "ix", name: "Zamboanga Peninsula", short: "IX", psgc: 900000000, color: "#1282a2" },
  { id: "x", name: "Northern Mindanao", short: "X", psgc: 1000000000, color: "#5cc0dc" },
  { id: "xi", name: "Davao Region", short: "XI", psgc: 1100000000, color: "#a9dbe7" },
  { id: "xii", name: "SOCCSKSARGEN", short: "XII", psgc: 1200000000, color: "#e8b85c" },
  { id: "xiii", name: "Caraga", short: "XIII", psgc: 1600000000, color: "#ef8a6a" },
  { id: "barmm", name: "BARMM", short: "BARMM", psgc: 1900000000, color: "#8fa9d6" },
];
export const REGION_BY_PSGC = Object.fromEntries(REGIONS.map((r) => [r.psgc, r.id])) as Record<number, RegionId>;
export const regionName = (s: Scope) => (s === "all" ? "All Mindanao" : REGIONS.find((r) => r.id === s)!.name);
export const SCOPES: Scope[] = ["all", ...REGIONS.map((r) => r.id)];

// ---- Sea labels (context only) --------------------------------------------

export type Ground = { id: string; name: string; lon: number; lat: number; anchor?: "start" | "end" };

export const GROUNDS: Ground[] = [
  { id: "sulu", name: "Sulu Sea", lon: 121.6, lat: 8.2 },
  { id: "moro", name: "Moro Gulf", lon: 123.3, lat: 6.7 },
  { id: "davao", name: "Davao Gulf", lon: 125.72, lat: 6.75 },
  { id: "bohol", name: "Bohol Sea", lon: 124.45, lat: 9.15 },
  { id: "phsea", name: "Philippine Sea", lon: 126.9, lat: 10.15, anchor: "end" },
  { id: "celebes", name: "Celebes Sea", lon: 124.4, lat: 5.35 },
];

// ---- Species ---------------------------------------------------------------

export type Species = {
  id: string;
  local: string;
  english: string;
  scientific: string;
  habitat: "Pelagic" | "Reef" | "Aquaculture" | "Freshwater";
  base: number; // metric tons per quarter, all Mindanao
  shares: number[]; // share of catch by region, in REGIONS order: IX X XI XII XIII BARMM
  sstSens: number;
  chlSens: number;
  trend: number; // fractional change per year
};

export const SPECIES: Species[] = [
  { id: "tamban", local: "Tamban", english: "Sardines", scientific: "Sardinella spp.", habitat: "Pelagic", base: 21800, shares: [0.6, 0.08, 0.04, 0.05, 0.03, 0.2], sstSens: -0.42, chlSens: 0.3, trend: -0.022 },
  { id: "galunggong", local: "Galunggong", english: "Round scad", scientific: "Decapterus spp.", habitat: "Pelagic", base: 17600, shares: [0.38, 0.1, 0.06, 0.08, 0.06, 0.32], sstSens: -0.31, chlSens: 0.22, trend: -0.016 },
  { id: "tulingan", local: "Tulingan", english: "Frigate & bullet tuna", scientific: "Auxis spp.", habitat: "Pelagic", base: 13900, shares: [0.18, 0.12, 0.14, 0.3, 0.08, 0.18], sstSens: -0.12, chlSens: 0.08, trend: -0.004 },
  { id: "bangus", local: "Bangus", english: "Milkfish", scientific: "Chanos chanos", habitat: "Aquaculture", base: 12300, shares: [0.22, 0.2, 0.14, 0.12, 0.24, 0.08], sstSens: 0.04, chlSens: 0.02, trend: 0.018 },
  { id: "tambakol", local: "Tambakol", english: "Yellowfin tuna", scientific: "Thunnus albacares", habitat: "Pelagic", base: 10400, shares: [0.05, 0.04, 0.16, 0.62, 0.05, 0.08], sstSens: 0.14, chlSens: -0.05, trend: 0.006 },
  { id: "tilapia", local: "Tilapia", english: "Nile tilapia", scientific: "Oreochromis niloticus", habitat: "Freshwater", base: 9100, shares: [0.06, 0.22, 0.1, 0.3, 0.1, 0.22], sstSens: -0.05, chlSens: 0.0, trend: 0.012 },
  { id: "dilis", local: "Dilis", english: "Anchovy", scientific: "Stolephorus spp.", habitat: "Pelagic", base: 6200, shares: [0.24, 0.3, 0.08, 0.06, 0.2, 0.12], sstSens: -0.36, chlSens: 0.38, trend: -0.019 },
  { id: "matambaka", local: "Matambaka", english: "Bigeye scad", scientific: "Selar crumenophthalmus", habitat: "Pelagic", base: 4900, shares: [0.2, 0.26, 0.1, 0.1, 0.18, 0.16], sstSens: -0.22, chlSens: 0.16, trend: -0.008 },
  { id: "alumahan", local: "Alumahan", english: "Indian mackerel", scientific: "Rastrelliger kanagurta", habitat: "Pelagic", base: 4100, shares: [0.26, 0.12, 0.12, 0.16, 0.1, 0.24], sstSens: -0.27, chlSens: 0.2, trend: -0.011 },
  { id: "dalagangbukid", local: "Dalagang bukid", english: "Yellowtail fusilier", scientific: "Pterocaesio chrysozona", habitat: "Reef", base: 2600, shares: [0.14, 0.1, 0.3, 0.12, 0.16, 0.18], sstSens: -0.33, chlSens: 0.06, trend: -0.014 },
  { id: "bisugo", local: "Bisugo", english: "Threadfin bream", scientific: "Nemipterus spp.", habitat: "Reef", base: 2200, shares: [0.2, 0.14, 0.24, 0.14, 0.14, 0.14], sstSens: -0.1, chlSens: 0.1, trend: -0.003 },
  { id: "tanigue", local: "Tanigue", english: "Spanish mackerel", scientific: "Scomberomorus commerson", habitat: "Pelagic", base: 1800, shares: [0.12, 0.1, 0.2, 0.14, 0.3, 0.14], sstSens: 0.09, chlSens: 0.04, trend: 0.003 },
  { id: "mayamaya", local: "Maya-maya", english: "Red snapper", scientific: "Lutjanus spp.", habitat: "Reef", base: 1500, shares: [0.16, 0.1, 0.26, 0.14, 0.16, 0.18], sstSens: -0.24, chlSens: 0.05, trend: -0.009 },
  { id: "lapulapu", local: "Lapu-lapu", english: "Grouper", scientific: "Epinephelus spp.", habitat: "Reef", base: 1200, shares: [0.18, 0.08, 0.14, 0.12, 0.16, 0.32], sstSens: -0.29, chlSens: 0.04, trend: -0.012 },
];

// ---- Time axis -------------------------------------------------------------

export const START_YEAR = 2016;
export const QUARTERS = Array.from({ length: 44 }, (_, i) => ({
  index: i,
  year: START_YEAR + Math.floor(i / 4),
  q: (i % 4) + 1,
}));
export const YEARS = Array.from({ length: 11 }, (_, i) => START_YEAR + i);
export const LAST_OBSERVED = 42; // 2026 Q3
export const FORECAST_INDEX = 43; // 2026 Q4

export const quarterLabel = (i: number) => `Q${QUARTERS[i].q} ${QUARTERS[i].year}`;

// ---- Deterministic noise ---------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rand: () => number) => {
  const u = rand() || 1e-9;
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ---- Ocean series ----------------------------------------------------------

export type OceanPoint = { index: number; sst: number; sstAnom: number; chl: number; chlAnom: number };

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
const REGION_OCEAN_PARAMS: Record<RegionId, { sst: number; amp: number; chl: number }> = {
  ix: { sst: 0.12, amp: 1.05, chl: 0.07 },
  x: { sst: -0.08, amp: 0.9, chl: 0.05 },
  xi: { sst: 0.05, amp: 1.1, chl: 0.04 },
  xii: { sst: 0.15, amp: 1.15, chl: -0.02 },
  xiii: { sst: -0.22, amp: 0.85, chl: 0.01 },
  barmm: { sst: 0.2, amp: 1.0, chl: -0.03 },
};

export const OCEAN: Record<Scope, OceanPoint[]> = {
  all: OCEAN_ALL,
  ...(Object.fromEntries(
    REGIONS.map((r, ri) => {
      const p = REGION_OCEAN_PARAMS[r.id];
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
  ) as Record<RegionId, OceanPoint[]>),
};

// ---- Landings --------------------------------------------------------------

const YIELD_SEASON: Record<Species["habitat"], number[]> = {
  Pelagic: [0.92, 0.98, 1.06, 1.04],
  Reef: [1.04, 1.0, 0.95, 1.01],
  Aquaculture: [0.9, 1.02, 1.1, 0.98],
  Freshwater: [0.98, 1.0, 1.03, 0.99],
};

export type YieldPoint = { index: number; value: number; low?: number; high?: number };

const withBand = (index: number, value: number, cap: number): YieldPoint => {
  if (index !== FORECAST_INDEX) return { index, value };
  const band = Math.min(cap, value * 0.06);
  return { index, value, low: value - band, high: value + band };
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
          const value = base * YIELD_SEASON[s.habitat][q - 1] * (1 + trend * (index / 4)) * effect * (1 + gauss(rand) * 0.08);
          return withBand(index, value, 500 * s.shares[ri] + 60);
        });
        return [s.id, pts];
      }),
    ),
  ]),
) as Record<RegionId, Record<string, YieldPoint[]>>;

const ALL: Record<string, YieldPoint[]> = Object.fromEntries(
  SPECIES.map((s) => [
    s.id,
    QUARTERS.map(({ index }) => withBand(index, REGIONS.reduce((a, r) => a + BY_REGION[r.id][s.id][index].value, 0), 500)),
  ]),
);

export const YIELDS: Record<Scope, Record<string, YieldPoint[]>> = { all: ALL, ...BY_REGION };

export const scopeMax = Object.fromEntries(
  SCOPES.map((sc) => [sc, Math.max(...SPECIES.flatMap((s) => YIELDS[sc][s.id].map((p) => p.value)))]),
) as Record<Scope, number>;

export function annualTotal(scope: Scope, id: string, year: number) {
  return YIELDS[scope][id].filter((p) => QUARTERS[p.index].year === year).reduce((a, p) => a + p.value, 0);
}

// ---- Statistics ------------------------------------------------------------

function pearson(a: number[], b: number[]) {
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

function correlate(s: Species, ys: YieldPoint[], ocean: OceanPoint[]) {
  const obs = ys.slice(0, LAST_OBSERVED + 1);
  const adj = obs.map((p) => p.value / YIELD_SEASON[s.habitat][QUARTERS[p.index].q - 1]);
  // remove linear trend so the score reflects ocean conditions, not drift
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

export type Corr = { sst: number; chl: number };

export const CORRELATION = Object.fromEntries(
  SCOPES.map((sc) => [sc, Object.fromEntries(SPECIES.map((s) => [s.id, correlate(s, YIELDS[sc][s.id], OCEAN[sc])]))]),
) as Record<Scope, Record<string, Corr>>;

export function strengthLabel(r: number) {
  const a = Math.abs(r);
  const dir = r < 0 ? "negative" : "positive";
  if (a < 0.2) return "No clear link";
  if (a < 0.4) return `Weak ${dir}`;
  if (a < 0.6) return `Moderate ${dir}`;
  return `Strong ${dir}`;
}

export const IMPORTS_2024_MT = 492170;

// ---- Regional catch mix ----------------------------------------------------

export type MixRow = { s: Species; v: number; share: number };

/** Every species landed in a scope for one quarter, largest first. */
export function catchMix(scope: Scope, index: number): MixRow[] {
  const rows = SPECIES.map((s) => ({ s, v: YIELDS[scope][s.id][index].value }));
  const total = rows.reduce((a, r) => a + r.v, 0);
  return rows.map((r) => ({ ...r, share: r.v / total })).sort((a, b) => b.v - a.v);
}

/** Top-n species in a scope by 2025 landings. */
export function topSpecies(scope: Scope, n = 10): string[] {
  return [...SPECIES]
    .sort((a, b) => annualTotal(scope, b.id, 2025) - annualTotal(scope, a.id, 2025))
    .slice(0, n)
    .map((s) => s.id);
}
