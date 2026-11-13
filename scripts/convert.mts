// Pure functions behind scripts/csv-to-json.ts: parse the observations CSV
// and reshape it into the compact JSON the app loads (src/data/observations.json).
// No file system access here, so it is easy to test (scripts/convert.test.mts).

/** Columns the CSV must have, in any order. */
export const COLUMNS = {
  year: "Year",
  quarter: "Quarter",
  province: "Province",
  species: "Species",
  chl: "Chlorophyll-A Concentration (mg/m³)",
  sst: "Sea Surface Temperature (°C)",
  yield: "Yield (Metric Tons)",
} as const;

export type Observations = {
  meta: {
    source: string;
    firstYear: number;
    /** Number of quarters; index 0 is Q1 of firstYear. */
    quarters: number;
    provinces: string[];
    /** App species id -> category name in the CSV. */
    species: Record<string, string>;
    units: { sst: string; chl: string; yield: string };
  };
  /** Approximate [lon, lat] of each province, for interpolating the ocean map. */
  centroids: Record<string, [number, number]>;
  sst: Record<string, number[]>;
  chl: Record<string, number[]>;
  /** null = not recorded (not zero). */
  yields: Record<string, Record<string, (number | null)[]>>;
};

export type Report = {
  rows: number;
  rowsUsed: number;
  skippedBeforeStart: number;
  missingYields: Record<string, number>;
  missingOcean: number;
};

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field || row.length) endRow();
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

function num(raw: string, what: string, line: number): number | null {
  const t = raw.trim();
  if (t === "" || t.toLowerCase() === "nan") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) throw new Error(`Line ${line}: ${what} "${raw}" is not a number`);
  return n;
}

type Options = {
  /** App species id -> CSV category. Only these categories are kept. */
  species: Record<string, string>;
  /** Drop rows before this year (e.g. a partial first year). */
  fromYear?: number;
  centroids: Record<string, [number, number]>;
  source: string;
};

export function convert(rows: string[][], opts: Options): { data: Observations; report: Report } {
  const [header, ...body] = rows;
  const col = Object.fromEntries(
    Object.entries(COLUMNS).map(([k, name]) => {
      const i = header.findIndex((h) => h.trim() === name);
      if (i < 0) throw new Error(`Missing column "${name}". Found: ${header.join(", ")}`);
      return [k, i];
    }),
  ) as Record<keyof typeof COLUMNS, number>;

  const byCategory = Object.fromEntries(Object.entries(opts.species).map(([id, cat]) => [cat, id]));
  // Loops, not Math.max(...rows): spreading 150k values overflows the stack.
  let firstYear = opts.fromYear ?? Infinity;
  if (opts.fromYear === undefined) for (const r of body) firstYear = Math.min(firstYear, Number(r[col.year]));
  const index = (year: number, q: number) => (year - firstYear) * 4 + (q - 1);
  let lastIndex = 0;
  for (const r of body) lastIndex = Math.max(lastIndex, index(Number(r[col.year]), Number(r[col.quarter].replace(/^Q/i, ""))));
  const n = lastIndex + 1;
  const provinces = [...new Set(body.map((r) => r[col.province].trim()))].sort();

  const sst: Record<string, number[]> = {};
  const chl: Record<string, number[]> = {};
  const yields: Observations["yields"] = {};
  const seenOcean: Record<string, boolean[]> = {};
  for (const p of provinces) {
    sst[p] = new Array(n).fill(NaN);
    chl[p] = new Array(n).fill(NaN);
    seenOcean[p] = new Array(n).fill(false);
    yields[p] = Object.fromEntries(Object.keys(opts.species).map((id) => [id, new Array<number | null>(n).fill(null)]));
  }

  const report: Report = { rows: body.length, rowsUsed: 0, skippedBeforeStart: 0, missingYields: {}, missingOcean: 0 };
  body.forEach((r, k) => {
    const line = k + 2;
    const year = Number(r[col.year]);
    const q = Number(r[col.quarter].replace(/^Q/i, ""));
    if (!Number.isInteger(year) || !(q >= 1 && q <= 4)) throw new Error(`Line ${line}: bad period "${r[col.year]} ${r[col.quarter]}"`);
    if (year < firstYear) return void report.skippedBeforeStart++;
    const i = index(year, q);
    const p = r[col.province].trim();

    // Ocean values repeat on every species row of a province-quarter: keep the first.
    if (!seenOcean[p][i]) {
      const s = num(r[col.sst], "SST", line);
      const c = num(r[col.chl], "chlorophyll-a", line);
      if (s !== null) sst[p][i] = round(s, 3);
      if (c !== null) chl[p][i] = round(c, 4);
      seenOcean[p][i] = true;
    }

    const id = byCategory[r[col.species].trim()];
    if (!id) return;
    report.rowsUsed++;
    const y = num(r[col.yield], "yield", line);
    if (y !== null && y < 0) throw new Error(`Line ${line}: negative yield ${y}`);
    yields[p][id][i] = y === null ? null : round(y, 2);
  });

  for (const p of provinces) {
    report.missingOcean += sst[p].filter(Number.isNaN).length + chl[p].filter(Number.isNaN).length;
    for (const id of Object.keys(opts.species)) report.missingYields[id] = (report.missingYields[id] ?? 0) + yields[p][id].filter((v) => v === null).length;
  }
  if (report.missingOcean) throw new Error(`${report.missingOcean} province-quarters have no SST or chlorophyll-a value`);
  const missingCats = Object.values(opts.species).filter((c) => !body.some((r) => r[col.species].trim() === c));
  if (missingCats.length) throw new Error(`Species categories not found in the CSV: ${missingCats.join(", ")}`);
  const noCentroid = provinces.filter((p) => !opts.centroids[p]);
  if (noCentroid.length) throw new Error(`No map shape for: ${noCentroid.join(", ")}`);

  return {
    data: {
      meta: { source: opts.source, firstYear, quarters: n, provinces, species: opts.species, units: { sst: "°C", chl: "mg/m³", yield: "t" } },
      centroids: Object.fromEntries(provinces.map((p) => [p, opts.centroids[p]])),
      sst,
      chl,
      yields,
    },
    report,
  };
}

type Geometry = { type: "Polygon"; coordinates: number[][][] } | { type: "MultiPolygon"; coordinates: number[][][][] };

/** Centroid of the largest polygon of a (Multi)Polygon: good enough to place a label or interpolate. */
export function centroid(g: Geometry): [number, number] {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  let best: [number, number] = [0, 0];
  let bestArea = -1;
  for (const [ring] of polys) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      a += f;
      cx += (ring[j][0] + ring[i][0]) * f;
      cy += (ring[j][1] + ring[i][1]) * f;
    }
    if (Math.abs(a) > bestArea) {
      bestArea = Math.abs(a);
      best = [round(cx / (3 * a), 3), round(cy / (3 * a), 3)];
    }
  }
  return best;
}
