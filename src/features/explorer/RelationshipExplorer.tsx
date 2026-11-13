"use client";

// Relationship Explorer: how one ocean variable relates to one species'
// landings in one area. All statistics come from /api/analysis.
import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Status } from "@/components/ui/Status";
import { LineChart } from "@/features/charts/LineChart";
import { ScatterPlot } from "@/features/charts/ScatterPlot";
import type { AnalysisResult } from "@/lib/analysis";
import { fmt } from "@/lib/format";
import { VARIABLE, fmtVar } from "@/lib/units";
import { useApi } from "@/lib/useApi";
import { ExplorerOptions } from "./ExplorerOptions";
import { InterpretationCard } from "./InterpretationCard";
import { LagProfile } from "./LagProfile";
import { ResultTiles } from "./ResultTiles";
import { StrongestList } from "./StrongestList";

type Props = React.ComponentProps<typeof ExplorerOptions> & { query: string } & React.ComponentProps<typeof StrongestList>;

export function RelationshipExplorer({ query, years, current, onPick, ...options }: Props) {
  const { data: a, loading, error } = useApi<AnalysisResult>("/api/analysis", query);
  const v = a ? VARIABLE[a.params.variable] : null;
  const unit = options.resolution === "quarterly" ? "quarters" : "years";

  const charts = useMemo(() => {
    if (!a || !v) return null;
    const labels = a.trend.map((t) => t.label);
    return {
      labels,
      env: [{ id: "env", name: v.name, color: v.color, values: a.trend.map((t) => t.env) }],
      yield: [{ id: "yield", name: a.speciesName, color: "var(--accent-text)", values: a.trend.map((t) => t.yield) }],
      points: a.pairs.map((p) => ({ x: p.x, y: p.y, label: p.label, note: a.params.lag ? `${v.name} from ${p.envLabel}` : undefined })),
    };
  }, [a, v]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-medium">Explore ocean–fisheries relationships</h1>
          <p className="mt-1 text-[13px] text-ink-2">
            {a ? (
              <>
                <span className="text-ink">{a.speciesName}</span> landings vs <span className="text-ink">{v!.long.toLowerCase()}</span> · {a.areaName} · {a.params.resolution} · {a.trend[0]?.label}–{a.trend.at(-1)?.label}
              </>
            ) : (
              "Pick a species, area and variable in the filters above."
            )}
          </p>
        </div>
        <ExplorerOptions {...options} />
      </div>

      <Status loading={loading && !a} error={error} />

      {a && charts && v && (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <ResultTiles stats={a.stats} unit={unit} missing={a.missing} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title={`${v.long} trend`} sub={`${a.areaName}, ${v.unit}, mean per ${a.params.resolution === "quarterly" ? "quarter" : "year"}`}>
              <LineChart labels={charts.labels} series={charts.env} format={(n) => fmtVar(a.params.variable, n)} ariaLabel={`${v.long} over time`} />
            </Card>
            <Card title={`${a.speciesName} yield trend`} sub={`Landings in ${a.areaName}, tonnes per ${a.params.resolution === "quarterly" ? "quarter" : "year"}`}>
              <LineChart labels={charts.labels} series={charts.yield} format={(n) => `${fmt(n)} t`} ariaLabel={`${a.speciesName} landings over time`} zero />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Card
              title={`${v.name} vs yield`}
              sub={`Each dot is one ${a.params.resolution === "quarterly" ? "quarter" : "year"}${a.params.lag ? `, paired with ${v.name} ${a.params.lag} period${a.params.lag > 1 ? "s" : ""} earlier` : ""}. Dashed line: least-squares fit.`}
            >
              <ScatterPlot
                points={charts.points}
                fit={a.stats}
                xLabel={a.units.x}
                yLabel={a.units.y}
                formatX={(n) => (a.applied.deseason || a.applied.detrend ? n.toFixed(v.digits) : fmtVar(a.params.variable, n))}
                formatY={(n) => (a.applied.deseason ? `${n.toFixed(1)}%` : `${fmt(n)} t`)}
              />
            </Card>
            <div className="space-y-4">
              <InterpretationCard interpretation={a.interpretation} />
              <Card title="Lagged relationships" sub={`Pearson r when ${v.name} leads landings. * p < 0.05`}>
                <LagProfile rows={a.lagProfile} current={a.params.lag} unit={options.resolution === "quarterly" ? "qtr" : "yr"} onPick={options.setLag} />
              </Card>
              <StrongestList years={years} current={current} onPick={onPick} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
