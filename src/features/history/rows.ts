// Builds the table/chart rows for the history modal. Pure, no React.
import { COMPLETE_YEARS, OCEAN, QUARTERS, REGIONS, YEARS, YIELDS, annualTotal, quarterLabel, type RegionId, type Scope, type Species } from "@/lib/data";

/** "q" = one row per quarter, "y" = one row per year. */
export type Grain = "q" | "y";

export type Row = {
  key: string;
  /** "Q3 2026" or "2026". */
  label: string;
  /** Landings in the scope, tonnes. */
  total: number;
  /** Landings per region. Holds every region for scope "all", else just the one. */
  byRegion: Record<RegionId, number>;
  sst: number;
  sstAnom: number;
  chl: number;
  chlAnom: number;
  /** True for a year with fewer than four observed quarters (2026). */
  partial: boolean;
  /** Change vs the same period a year earlier, in percent. */
  yoy: number | null;
};

const pctChange = (now: number, prev: number | null) => (prev ? ((now - prev) / prev) * 100 : null);

export function scopeRegions(scope: Scope) {
  return scope === "all" ? REGIONS : REGIONS.filter((r) => r.id === scope);
}

export function buildRows(species: Species, scope: Scope, grain: Grain): Row[] {
  const regions = scopeRegions(scope).map((r) => r.id);
  const ocean = OCEAN[scope];
  const series = YIELDS[scope][species.id];

  if (grain === "q") {
    return QUARTERS.map((_, i) => ({
      key: `q${i}`,
      label: quarterLabel(i),
      total: series[i].value,
      byRegion: Object.fromEntries(regions.map((r) => [r, YIELDS[r][species.id][i].value])) as Record<RegionId, number>,
      sst: ocean[i].sst,
      sstAnom: ocean[i].sstAnom,
      chl: ocean[i].chl,
      chlAnom: ocean[i].chlAnom,
      partial: false,
      yoy: pctChange(series[i].value, i >= 4 ? series[i - 4].value : null),
    }));
  }

  return YEARS.map((year, yi) => {
    const quarters = QUARTERS.filter((q) => q.year === year).map((q) => q.index);
    const mean = (k: "sst" | "sstAnom" | "chl" | "chlAnom") => quarters.reduce((a, i) => a + ocean[i][k], 0) / quarters.length;
    const total = annualTotal(scope, species.id, year);
    return {
      key: `y${year}`,
      label: String(year),
      total,
      byRegion: Object.fromEntries(regions.map((r) => [r, annualTotal(r, species.id, year)])) as Record<RegionId, number>,
      sst: mean("sst"),
      sstAnom: mean("sstAnom"),
      chl: mean("chl"),
      chlAnom: mean("chlAnom"),
      partial: !COMPLETE_YEARS.includes(year),
      yoy: pctChange(total, yi > 0 ? annualTotal(scope, species.id, year - 1) : null),
    };
  });
}
