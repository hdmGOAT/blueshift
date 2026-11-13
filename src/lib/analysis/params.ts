// Query parameters shared by the UI and the /api routes. The UI builds a query
// string with toQuery(); each route parses it back with the matching parser,
// which validates every field and reports the first problem as a message.
import { COMPLETE_YEARS, SPECIES_BY_ID, YEARS, isArea, type AreaId, type Layer } from "@/lib/data";

export type Resolution = "quarterly" | "annual";

/** Filters every view shares. */
export type BaseParams = { area: AreaId; from: number; to: number; resolution: Resolution };

export type OceanParams = BaseParams & { variable: Layer };
/** `species` empty = all species. */
export type FisheriesParams = BaseParams & { species: string[] };
export type RegionalParams = { from: number; to: number; variable: Layer; species: string[] };
export type AnalysisParams = BaseParams & {
  species: string;
  variable: Layer;
  /** Periods the ocean variable leads the yield by (0 = same period). */
  lag: number;
  /** Quarterly only: compare departures from each quarter's normal. */
  deseason: boolean;
  /** Remove a straight-line trend from both series first. */
  detrend: boolean;
};

/** Largest lag offered, in periods of the chosen resolution. */
export const MAX_LAG: Record<Resolution, number> = { quarterly: 4, annual: 2 };

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const FIRST_YEAR = YEARS[0];
const LAST_YEAR = YEARS[YEARS.length - 1];

class ParamError extends Error {}
const fail = (msg: string): never => {
  throw new ParamError(msg);
};

function wrap<T>(fn: () => T): Parsed<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof ParamError) return { ok: false, error: e.message };
    throw e;
  }
}

const str = (q: URLSearchParams, k: string, dflt: string) => q.get(k) ?? dflt;

function int(q: URLSearchParams, k: string, dflt: number, min: number, max: number) {
  const raw = q.get(k);
  if (raw === null) return dflt;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) fail(`"${k}" must be a whole number from ${min} to ${max}`);
  return n;
}

function oneOf<T extends string>(q: URLSearchParams, k: string, options: readonly T[], dflt: T): T {
  const v = str(q, k, dflt);
  if (!options.includes(v as T)) fail(`"${k}" must be one of: ${options.join(", ")}`);
  return v as T;
}

const bool = (q: URLSearchParams, k: string, dflt: boolean) => {
  const v = q.get(k);
  return v === null ? dflt : v === "1" || v === "true";
};

function speciesList(q: URLSearchParams) {
  const raw = q.get("species");
  if (!raw) return [];
  const ids = raw.split(",").filter(Boolean);
  for (const id of ids) if (!SPECIES_BY_ID[id]) fail(`Unknown species "${id}"`);
  return ids;
}

function years(q: URLSearchParams) {
  const from = int(q, "from", FIRST_YEAR, FIRST_YEAR, LAST_YEAR);
  const to = int(q, "to", LAST_YEAR, FIRST_YEAR, LAST_YEAR);
  if (from > to) fail(`"from" (${from}) is after "to" (${to})`);
  return { from, to };
}

function base(q: URLSearchParams): BaseParams {
  const area = str(q, "area", "all");
  if (!isArea(area)) fail(`Unknown area "${area}"`);
  const resolution = oneOf(q, "resolution", ["quarterly", "annual"] as const, "quarterly");
  const { from, to } = years(q);
  if (resolution === "annual" && !COMPLETE_YEARS.some((y) => y >= from && y <= to))
    fail(`Annual resolution needs at least one complete year between ${from} and ${to}`);
  return { area, from, to, resolution };
}

const variable = (q: URLSearchParams) => oneOf(q, "variable", ["sst", "chl"] as const, "sst");

export const parseOcean = (q: URLSearchParams) => wrap<OceanParams>(() => ({ ...base(q), variable: variable(q) }));
export const parseFisheries = (q: URLSearchParams) => wrap<FisheriesParams>(() => ({ ...base(q), species: speciesList(q) }));
export const parseRegional = (q: URLSearchParams) => wrap<RegionalParams>(() => ({ ...years(q), variable: variable(q), species: speciesList(q) }));

export const parseAnalysis = (q: URLSearchParams) =>
  wrap<AnalysisParams>(() => {
    const b = base(q);
    const species = str(q, "species", "galunggong");
    if (!SPECIES_BY_ID[species]) fail(`Unknown species "${species}"`);
    return {
      ...b,
      species,
      variable: variable(q),
      lag: int(q, "lag", 0, 0, MAX_LAG[b.resolution]),
      deseason: bool(q, "deseason", true),
      detrend: bool(q, "detrend", false),
    };
  });

/** Serialise params for a request URL. Arrays become comma lists; booleans 1/0. */
export function toQuery(p: Record<string, string | number | boolean | string[]>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (Array.isArray(v)) {
      if (v.length) q.set(k, v.join(","));
    } else q.set(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  return q.toString();
}
