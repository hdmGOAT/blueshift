// CSV builders for /api/export: one per dataset, each from the same summary
// the matching view shows, so a download always equals what is on screen.
import type { AnalysisResult } from "./relationship";
import type { FisheriesSummary } from "./fisheries";
import type { OceanSummary } from "./ocean";
import type { RegionalSummary } from "./regional";

type Cell = string | number | boolean | null | undefined;

const cell = (v: Cell) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "yes" : "no";
  const s = typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(4)) : v;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Lines starting with # describe the export; spreadsheet tools skip or show them. */
export function toCsv(meta: Record<string, Cell>, header: string[], rows: Cell[][]) {
  const head = Object.entries(meta).map(([k, v]) => `# ${k}: ${v ?? ""}`);
  return [...head, header.join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n") + "\n";
}

const SAMPLE = "SAMPLE DATA - generated, not PSA or NASA values";

export function analysisCsv(a: AnalysisResult) {
  const p = a.params;
  const s = a.stats;
  return toCsv(
    {
      dataset: "Ocean-fisheries relationship",
      note: SAMPLE,
      area: a.areaName,
      species: a.speciesName,
      variable: p.variable,
      resolution: p.resolution,
      years: `${p.from}-${p.to}`,
      lag: p.lag,
      deseasoned: a.applied.deseason,
      detrended: a.applied.detrend,
      pearson: s?.pearson.toFixed(4),
      pearson_p: s?.pPearson.toPrecision(3),
      spearman: s?.spearman.toFixed(4),
      spearman_p: s?.pSpearman.toPrecision(3),
      n: s?.n,
      interpretation: a.interpretation.headline,
    },
    ["period", "env_period", "x_adjusted", "y_adjusted"],
    a.pairs.map((r) => [r.label, r.envLabel, r.x, r.y]),
  );
}

export function oceanCsv(o: OceanSummary) {
  return toCsv(
    { dataset: "Ocean conditions", note: SAMPLE, area: o.areaName, variable: o.params.variable, unit: o.unit, resolution: o.params.resolution, baseline: "2016-2020" },
    ["period", "value", "anomaly_vs_baseline"],
    o.series.map((r) => [r.label, r.value, r.anomaly]),
  );
}

export function fisheriesCsv(f: FisheriesSummary) {
  const lines = Object.keys(f.series[0]?.bySpecies ?? {});
  return toCsv(
    { dataset: "Fisheries production (t)", note: SAMPLE, area: f.areaName, species: f.speciesIds.join(" "), resolution: f.params.resolution, years: `${f.params.from}-${f.params.to}` },
    ["period", "total_t", ...lines.map((id) => `${id}_t`)],
    f.series.map((r) => [r.label, r.total, ...lines.map((id) => r.bySpecies[id])]),
  );
}

export function regionalCsv(r: RegionalSummary) {
  const p = r.params;
  return toCsv(
    { dataset: "Regional insights", note: SAMPLE, variable: p.variable, species: p.species.join(" ") || "all", years: `${p.from}-${p.to}` },
    ["level", "id", "name", "region", "coastal", "env_mean", "env_change_per_decade", "landings_t", "landings_change_pct", "concern"],
    [...r.regions.map((x) => ["region", x] as const), ...r.provinces.map((x) => ["province", x] as const)].map(([level, x]) => [
      level, x.id, x.name, x.region, x.coastal ? "yes" : "no", x.envMean, x.envPerDecade, x.yieldTotal, x.yieldChangePct, x.concern,
    ]),
  );
}
