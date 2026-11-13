"use client";

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { LineChart } from "@/features/charts/LineChart";
import type { RegionalSummary } from "@/lib/analysis";
import type { Layer } from "@/lib/data";
import { fmt } from "@/lib/format";
import { VARIABLE, fmtVar } from "@/lib/units";

const COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

/** Two charts for the chosen provinces: ocean variable, then landings (never one dual-axis chart). */
export const CompareCharts = memo(function CompareCharts({ summary, ids, layer }: { summary: RegionalSummary; ids: string[]; layer: Layer }) {
  const v = VARIABLE[layer];
  const rows = useMemo(() => ids.map((id) => summary.provinces.find((p) => p.id === id)!).filter(Boolean), [ids, summary]);
  if (!rows.length) return <Card title="Compare provinces">{<p className="text-[12.5px] text-ink-3">Click provinces on the map or tick them in the table.</p>}</Card>;
  const env = rows.map((r, i) => ({ id: r.id, name: r.name, color: COLORS[i], values: r.envSeries }));
  const yld = rows.map((r, i) => ({ id: r.id, name: r.name, color: COLORS[i], values: r.yieldSeries }));
  return (
    <Card title="Compare provinces" sub="Quarterly values">
      <div className="label mb-1">{v.name}, {v.unit}</div>
      <LineChart labels={summary.labels} series={env} format={(n) => fmtVar(layer, n)} ariaLabel={`${v.long} in the compared provinces`} height={170} />
      <div className="label mb-1 mt-4">Landings, t</div>
      <LineChart labels={summary.labels} series={yld} format={(n) => `${fmt(n)} t`} ariaLabel="Landings in the compared provinces" height={170} zero />
    </Card>
  );
});
