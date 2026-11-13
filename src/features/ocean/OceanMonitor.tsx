"use client";

// Ocean Monitor: SST or chlorophyll-a for an area over a year range. Map of
// province means, trend over time, summary statistics and a year comparison.
// Data from /api/ocean.
import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Status } from "@/components/ui/Status";
import { StatTile } from "@/components/ui/StatTile";
import { BarList } from "@/features/charts/BarList";
import { LineChart } from "@/features/charts/LineChart";
import { FieldLegend } from "@/features/map/Legends";
import { ProvinceMap } from "@/features/map/ProvinceMap";
import type { OceanSummary } from "@/lib/analysis";
import { areaProvinces, quarterLabel, quartersIn, type AreaId, type Layer } from "@/lib/data";
import { fieldColor } from "@/lib/field";
import { signed } from "@/lib/format";
import { VARIABLE, fmtVar } from "@/lib/units";
import { useApi } from "@/lib/useApi";

type Props = { query: string; area: AreaId; setArea: (a: AreaId) => void; layer: Layer; years: [number, number] };

export function OceanMonitor({ query, area, setArea, layer, years }: Props) {
  const { data: o, loading, error } = useApi<OceanSummary>("/api/ocean", query);
  const v = VARIABLE[layer];
  const lastQuarter = quartersIn(...years).at(-1)!;

  const map = useMemo(() => (o ? Object.fromEntries(o.provinces.map((p) => [p.id, p.value])) : {}), [o]);
  const selected = useMemo(() => (area === "all" ? [] : areaProvinces(area).map((p) => p.id)), [area]);

  // Warmer water and lower chlorophyll are the worrying directions.
  const worrying = (d: number) => (layer === "sst" ? d > 0 : d < 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[24px] font-medium">Ocean Monitor</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          {v.long} from NASA MODIS-Aqua · {o?.areaName ?? "…"} · {years[0]}–{years[1]}
        </p>
      </div>
      <Status loading={loading && !o} error={error} />

      {o && (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Average" value={fmtVar(layer, o.stats.mean)} sub={`${o.stats.n} ${o.params.resolution === "quarterly" ? "quarters" : "years"}`} />
            <StatTile label="Minimum" value={fmtVar(layer, o.stats.min)} sub={o.stats.minLabel} />
            <StatTile label="Maximum" value={fmtVar(layer, o.stats.max)} sub={o.stats.maxLabel} />
            <StatTile
              label="Trend"
              value={`${signed(o.change.perDecade, v.digits)}`}
              tone={worrying(o.change.perDecade) ? "var(--warm)" : "var(--accent-text)"}
              sub={`${v.unit} per decade, seasonally adjusted`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <Card title={`${v.name} by province`} sub={`Mean over ${years[0]}–${years[1]}; sea shows ${quarterLabel(lastQuarter)}. Click a province to select it.`}>
              <ProvinceMap
                values={map}
                color={(x) => fieldColor(layer, x)}
                format={(x) => fmtVar(layer, x)}
                selected={selected}
                onPick={setArea}
                raster={{ layer, index: lastQuarter }}
                ariaLabel={`Map of mean ${v.long} by province`}
                legend={<div className="glass rounded-lg px-2 py-1.5"><FieldLegend layer={layer} /></div>}
              />
            </Card>
            <div className="space-y-4">
              <Card title={`${v.name} over time`} sub={`${o.areaName}. Dashed line: 2016–20 average.`}>
                <LineChart
                  labels={o.series.map((s) => s.label)}
                  series={[{ id: "v", name: v.name, color: v.color, values: o.series.map((s) => s.value) }]}
                  format={(x) => fmtVar(layer, x)}
                  reference={{ value: o.baseline, label: "2016–20" }}
                  ariaLabel={`${v.long} over time in ${o.areaName}`}
                />
              </Card>
              <Card title="Year by year" sub={`Departure from the 2016–20 normal, ${v.unit}. Partial years are marked.`}>
                <BarList
                  diverging
                  rows={o.years.map((y) => ({
                    id: String(y.year),
                    name: String(y.year),
                    value: y.anomaly,
                    sub: y.partial ? "Q1–Q3 only" : undefined,
                    color: worrying(y.anomaly) ? "var(--warm)" : "var(--accent-text)",
                  }))}
                  format={(x) => signed(x, v.digits)}
                />
                <p className="mt-2 text-[11px] text-ink-3">Coral bars: {layer === "sst" ? "warmer" : "lower chlorophyll"} than normal (the direction of concern for most fisheries).</p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
