"use client";

// Sortable table of every province (grouped by nothing, sorted by any column)
// with the six regions as a summary block underneath.
import { memo, useMemo, useState } from "react";
import type { AreaRow, RegionalSummary } from "@/lib/analysis";
import { REGION_BY_ID, type Layer, type RegionId } from "@/lib/data";
import { fmt, signed, trendColor } from "@/lib/format";
import { VARIABLE, fmtVar } from "@/lib/units";

type Key = "name" | "envMean" | "envPerDecade" | "yieldTotal" | "yieldChangePct";
type Props = { summary: RegionalSummary; layer: Layer; compare: string[]; onToggle: (id: string) => void };

const COLS = "28px minmax(140px,1.4fr) 1fr 1fr 1fr 1fr 0.9fr";

export const ProvinceTable = memo(function ProvinceTable({ summary, layer, compare, onToggle }: Props) {
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: "yieldTotal", desc: true });
  const v = VARIABLE[layer];
  const worse = (x: number) => (layer === "sst" ? -x : x); // for colouring

  const rows = useMemo(() => {
    const val = (r: AreaRow) => (sort.key === "name" ? r.name : (r[sort.key] ?? -Infinity));
    return [...summary.provinces].sort((a, b) => {
      const x = val(a), y = val(b);
      const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return sort.desc ? -c : c;
    });
  }, [summary, sort]);

  const head = (key: Key, label: string) => (
    <button onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" }))} className={`text-left hover:text-ink ${sort.key === key ? "text-ink" : ""}`} aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : undefined}>
      {label}
      {sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}
    </button>
  );

  const line = (r: AreaRow, checkbox: boolean) => (
    <div key={r.id} role="row" className={`grid items-center gap-2 border-t border-line px-1 py-1.5 text-[12.5px] ${compare.includes(r.id) ? "bg-hi" : ""}`} style={{ gridTemplateColumns: COLS }}>
      <span>{checkbox && <input type="checkbox" checked={compare.includes(r.id)} onChange={() => onToggle(r.id)} aria-label={`Compare ${r.name}`} className="h-3.5 w-3.5" />}</span>
      <span className="min-w-0 truncate text-ink">
        {r.name} {checkbox && <span className="text-ink-3">· {REGION_BY_ID[r.region as RegionId]?.short}</span>}
      </span>
      <span className="text-ink-2">{r.coastal ? fmtVar(layer, r.envMean, false) : <span className="text-ink-3">inland</span>}</span>
      <span style={{ color: r.coastal ? trendColor(worse(r.envPerDecade)) : undefined }}>{r.coastal ? signed(r.envPerDecade, v.digits) : "–"}</span>
      <span className="text-ink-2">{fmt(r.yieldTotal)}</span>
      <span style={{ color: r.yieldChangePct === null ? undefined : trendColor(r.yieldChangePct) }}>{r.yieldChangePct === null ? "–" : `${signed(r.yieldChangePct, 1)}%`}</span>
      <span className={r.concern ? "text-warm" : "text-ink-3"}>{r.concern ? "Concern" : "–"}</span>
    </div>
  );

  return (
    <div className="scroll-thin overflow-x-auto" role="table" aria-label="Province summaries">
      <div className="min-w-[720px]">
        <div role="row" className="label grid gap-2 px-1 pb-2" style={{ gridTemplateColumns: COLS }}>
          <span />
          {head("name", "Province")}
          {head("envMean", `${v.name} mean`)}
          {head("envPerDecade", "Per decade")}
          {head("yieldTotal", "Landings, t")}
          {head("yieldChangePct", "Change")}
          <span>Flag</span>
        </div>
        {rows.map((r) => line(r, true))}
        <div className="label mt-4 px-1 pb-2">Regions</div>
        {summary.regions.map((r) => line(r, false))}
      </div>
    </div>
  );
});
