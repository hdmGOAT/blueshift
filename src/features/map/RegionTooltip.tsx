"use client";

import { memo } from "react";
import { REGION_BY_ID, catchMix, type RegionId } from "@/lib/data";
import { fmt } from "@/lib/format";

const ROWS = 5;

/** Hover card for a region: total landings and its top species this quarter. */
export const RegionTooltip = memo(function RegionTooltip({ region, index, selectedId }: { region: RegionId; index: number; selectedId: string }) {
  const mix = catchMix(region, index);
  const total = mix.reduce((a, m) => a + m.v, 0);
  return (
    <div className="rounded-lg border border-line-strong bg-glass-strong px-2.5 py-1.5 text-[12px] shadow-xl backdrop-blur">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-ink">{REGION_BY_ID[region].name}</span>
        <span className="text-ink-3">{fmt(total)} t</span>
      </div>
      <ul className="mt-1.5 w-[210px] space-y-1">
        {mix.slice(0, ROWS).map((m) => (
          <li key={m.s.id} className="grid items-center gap-2" style={{ gridTemplateColumns: "86px 1fr 34px" }}>
            <span className={m.s.id === selectedId ? "font-medium text-ink" : "text-ink-2"}>{m.s.local}</span>
            <span className="h-1 overflow-hidden rounded-full bg-hi">
              <span className="block h-full rounded-full bg-accent-text" style={{ width: `${((m.share / mix[0].share) * 100).toFixed(1)}%` }} />
            </span>
            <span className="text-right text-ink-3">{(m.share * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 text-[11px] text-ink-3">+{mix.length - ROWS} more species · click to open</div>
    </div>
  );
});
