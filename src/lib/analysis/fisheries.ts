// Fisheries Tracker summary: production for an area and species set over a
// year range, with rankings and comparisons. Served by /api/fisheries.
import { REGIONS, SPECIES, SPECIES_BY_ID, areaName, areaProvinces, isProvince, PROVINCE_BY_ID, provincesOf, type Habitat } from "@/lib/data";
import type { FisheriesParams } from "./params";
import { periods, perYear, seasonallyAdjusted, yieldSeries } from "./series";
import { fittedChange, type Change } from "./trend";

/** Most species drawn as separate lines in the trend chart. */
export const MAX_LINES = 5;

export type Place = { id: string; name: string; total: number; share: number; selected: boolean };

export type FisheriesSummary = {
  params: FisheriesParams;
  areaName: string;
  /** Species included (all when none were chosen). */
  speciesIds: string[];
  total: number;
  change: Change;
  /** Total per period, plus a line per species when up to MAX_LINES are chosen. */
  series: { label: string; total: number; bySpecies: Record<string, number> }[];
  /** Every species in the area over the range, largest first. */
  ranking: { id: string; name: string; english: string; total: number; share: number; changePct: number | null }[];
  /** Provinces compared: those in the area, or a province's neighbours in its region. */
  provinces: Place[];
  /** Regions compared (always all six). */
  regions: Place[];
  /** Share of the selection by habitat. */
  habitats: { habitat: Habitat; total: number; share: number }[];
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

function places(items: { id: string; name: string }[], species: string[], per: ReturnType<typeof periods>, selected: string) {
  const totals = items.map((it) => sum(yieldSeries(it.id, species, per)));
  const all = sum(totals) || 1;
  return items.map((it, i) => ({ ...it, total: totals[i], share: totals[i] / all, selected: it.id === selected })).sort((a, b) => b.total - a.total);
}

export function fisheriesSummary(params: FisheriesParams): FisheriesSummary {
  const { area, species, resolution, from, to } = params;
  const per = periods(resolution, from, to);
  const ids = species.length ? species : SPECIES.map((s) => s.id);
  const totals = yieldSeries(area, ids, per);
  const lines = species.length && species.length <= MAX_LINES ? species : [];
  const lineSeries = Object.fromEntries(lines.map((id) => [id, yieldSeries(area, [id], per)]));

  const ranking = SPECIES.map((s) => {
    const ys = yieldSeries(area, [s.id], per);
    return { id: s.id, name: s.local, english: s.english, total: sum(ys), changePct: fittedChange(seasonallyAdjusted(ys, per), perYear(resolution)).pct };
  });
  const rankTotal = sum(ranking.map((r) => r.total)) || 1;

  const habitatTotals = new Map<Habitat, number>();
  for (const r of ranking) if (ids.includes(r.id)) habitatTotals.set(SPECIES_BY_ID[r.id].habitat, (habitatTotals.get(SPECIES_BY_ID[r.id].habitat) ?? 0) + r.total);
  const grand = sum([...habitatTotals.values()]) || 1;

  const provinceSet = isProvince(area) ? provincesOf(PROVINCE_BY_ID[area].region) : areaProvinces(area);

  return {
    params,
    areaName: areaName(area),
    speciesIds: ids,
    total: sum(totals),
    change: fittedChange(seasonallyAdjusted(totals, per), perYear(resolution)),
    series: per.map((p, i) => ({ label: p.label, total: totals[i], bySpecies: Object.fromEntries(lines.map((id) => [id, lineSeries[id][i]])) })),
    ranking: ranking.map((r) => ({ ...r, share: r.total / rankTotal })).sort((a, b) => b.total - a.total),
    provinces: places(provinceSet, ids, per, area),
    regions: places(REGIONS, ids, per, area),
    habitats: [...habitatTotals].map(([habitat, total]) => ({ habitat, total, share: total / grand })).sort((a, b) => b.total - a.total),
  };
}
