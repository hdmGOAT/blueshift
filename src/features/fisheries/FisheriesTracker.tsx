"use client";

// Fisheries Tracker: PSA production for an area and species selection.
// Totals, trends, species ranking, province/region comparison and distribution.
// Data from /api/fisheries.
import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Status } from "@/components/ui/Status";
import { StatTile } from "@/components/ui/StatTile";
import { BarList } from "@/features/charts/BarList";
import { LineChart } from "@/features/charts/LineChart";
import type { FisheriesSummary } from "@/lib/analysis";
import { SPECIES_BY_ID, type AreaId } from "@/lib/data";
import { fmt, signed, trendColor } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { Distribution } from "./Distribution";

type Props = { query: string; setArea: (a: AreaId) => void; tracked: string[]; setTracked: (ids: string[]) => void };

const SERIES_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];
const pct = (n: number | null) => (n === null ? "–" : `${signed(n, 1)}%`);

export function FisheriesTracker({ query, setArea, tracked, setTracked }: Props) {
  const { data: f, loading, error } = useApi<FisheriesSummary>("/api/fisheries", query);
  const per = f?.params.resolution === "annual" ? "year" : "quarter";

  const series = useMemo(() => {
    if (!f) return [];
    const lines = Object.keys(f.series[0]?.bySpecies ?? {});
    if (lines.length > 1)
      return lines.map((id, i) => ({ id, name: SPECIES_BY_ID[id].local, color: SERIES_COLORS[i], values: f.series.map((s) => s.bySpecies[id]) }));
    return [{ id: "total", name: tracked.length === 1 ? SPECIES_BY_ID[tracked[0]].local : "All species", color: "var(--accent-text)", values: f.series.map((s) => s.total) }];
  }, [f, tracked]);

  const selection = tracked.length === 0 ? "all species" : tracked.length === 1 ? SPECIES_BY_ID[tracked[0]].local : `${tracked.length} species`;
  const toggleSpecies = (id: string) => setTracked(tracked.includes(id) ? tracked.filter((x) => x !== id) : [...tracked, id]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[24px] font-medium">Fisheries Tracker</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          PSA fisheries production · {f?.areaName ?? "…"} · {selection}
        </p>
      </div>
      <Status loading={loading && !f} error={error} />

      {f && (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Total yield" value={`${fmt(f.total)} t`} sub={`Recorded, ${f.params.from}–${f.params.to} · ${selection}${f.missing ? ` · ${f.missing} ${per}s not recorded` : ""}`} />
            <StatTile label="Change over period" value={pct(f.change.pct)} tone={f.change.pct === null ? undefined : trendColor(f.change.pct)} sub="Fitted trend, seasonally adjusted" />
            <StatTile label={`Average per ${per}`} value={`${fmt(f.total / Math.max(1, f.series.length))} t`} sub={`${f.series.length} ${per}s`} />
            <StatTile label="Top producer" value={f.provinces[0]?.name ?? "–"} sub={f.provinces[0] ? `${(f.provinces[0].share * 100).toFixed(0)}% of compared provinces` : undefined} />
          </div>

          <Card title={`${f.params.resolution === "annual" ? "Annual" : "Quarterly"} production`} sub={`Tonnes per ${per}, ${f.areaName}. Select up to 5 species to compare them as lines.`}>
            <LineChart labels={f.series.map((s) => s.label)} series={series} format={(n) => `${fmt(n)} t`} ariaLabel="Production over time" zero height={240} />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Species ranking" sub="By production over the period. Click to add or remove from the selection.">
              <BarList
                rows={f.ranking.map((r) => ({ id: r.id, name: r.name, sub: `${(r.share * 100).toFixed(1)}% · ${pct(r.changePct)}`, value: r.total, selected: tracked.includes(r.id) }))}
                format={(n) => `${fmt(n)} t`}
                onPick={toggleSpecies}
              />
            </Card>
            <Card title="Provincial comparison" sub={`${selection} · click a province to focus on it`}>
              <BarList rows={f.provinces.map((p) => ({ id: p.id, name: p.name, sub: `${(p.share * 100).toFixed(1)}%`, value: p.total, selected: p.selected }))} format={(n) => `${fmt(n)} t`} onPick={setArea} />
            </Card>
            <div className="space-y-4">
              <Card title="Regional comparison" sub={selection}>
                <BarList rows={f.regions.map((p) => ({ id: p.id, name: p.name, sub: `${(p.share * 100).toFixed(1)}%`, value: p.total, selected: p.selected }))} format={(n) => `${fmt(n)} t`} onPick={setArea} />
              </Card>
              <Card title="Production distribution" sub="Share of the selection by habitat">
                <Distribution rows={f.habitats} />
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
