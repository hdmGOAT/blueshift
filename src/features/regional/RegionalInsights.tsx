"use client";

// Regional Insights: ocean conditions and landings for every province side
// by side, a map of change, flagged areas of concern, and a comparison of
// chosen provinces. Data from /api/regional.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { Status } from "@/components/ui/Status";
import { ProvinceMap } from "@/features/map/ProvinceMap";
import { ENV_ALERT, type RegionalSummary } from "@/lib/analysis";
import { corrColor } from "@/lib/colors";
import type { Layer } from "@/lib/data";
import { fieldColor } from "@/lib/field";
import { signed } from "@/lib/format";
import { VARIABLE, fmtVar } from "@/lib/units";
import { useApi } from "@/lib/useApi";
import { CompareCharts } from "./CompareCharts";
import { ConcernList } from "./ConcernList";
import { ProvinceTable } from "./ProvinceTable";

type Metric = "envChange" | "yieldChange" | "envMean";
type Props = { query: string; layer: Layer; years: [number, number]; tracked: string[] };

const MAX_COMPARE = 4;

export function RegionalInsights({ query, layer, years, tracked }: Props) {
  const { data: r, loading, error } = useApi<RegionalSummary>("/api/regional", query);
  const [metric, setMetric] = useState<Metric>("envChange");
  const [compare, setCompare] = useState<string[]>(["zamboanga-del-norte", "davao-oriental"]);
  const v = VARIABLE[layer];

  const toggleCompare = (id: string) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= MAX_COMPARE ? [...c.slice(1), id] : [...c, id]));

  const map = useMemo(() => {
    if (!r) return null;
    // Normalise so the diverging colour scale reads coral = worse, cerulean = better.
    const alert = Math.abs(ENV_ALERT[layer]) * 3;
    const value = (p: RegionalSummary["provinces"][number]) =>
      metric === "envMean" ? (p.coastal ? p.envMean : null) : metric === "envChange" ? (p.coastal ? p.envPerDecade : null) : p.yieldChangePct;
    const color =
      metric === "envMean"
        ? (x: number) => fieldColor(layer, x)
        : metric === "envChange"
          ? (x: number) => corrColor(((layer === "sst" ? -x : x) / alert) * 0.9)
          : (x: number) => corrColor((x / 30) * 0.9);
    const format = (x: number) => (metric === "yieldChange" ? `${signed(x, 1)}% landings` : metric === "envChange" ? `${signed(x, v.digits)} ${v.unit}/decade` : fmtVar(layer, x));
    return { values: Object.fromEntries(r.provinces.map((p) => [p.id, value(p)])), color, format };
  }, [r, metric, layer, v]);

  const flagged = useMemo(() => r?.provinces.filter((p) => p.concern).map((p) => p.id) ?? [], [r]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[24px] font-medium">Regional Insights</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          {v.long} and {tracked.length ? `${tracked.length} selected species` : "all species"} across Mindanao&apos;s provinces · {years[0]}–{years[1]}
        </p>
      </div>
      <Status loading={loading && !r} error={error} />

      {r && map && (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <Card
              title="Geographic patterns"
              sub="Coral = change in the direction of concern. Rings mark potential areas of concern. Click provinces to compare them."
              action={<Segmented size="sm" value={metric} onChange={setMetric} options={[["envChange", `${v.name} change`], ["yieldChange", "Landings change"], ["envMean", `${v.name} level`]]} />}
            >
              <ProvinceMap values={map.values} color={map.color} format={map.format} flagged={flagged} selected={compare} onPick={toggleCompare} ariaLabel="Map of provinces coloured by change" />
            </Card>
            <div className="space-y-4">
              <ConcernList rows={r.provinces} layer={layer} onPick={toggleCompare} />
              <CompareCharts summary={r} ids={compare} layer={layer} />
            </div>
          </div>
          <Card title="Province and region summaries" sub={`Ocean values are means over coastal waters; changes are fitted, seasonally adjusted trends. Tick up to ${MAX_COMPARE} provinces to compare.`}>
            <ProvinceTable summary={r} layer={layer} compare={compare} onToggle={toggleCompare} />
          </Card>
        </div>
      )}
    </div>
  );
}
