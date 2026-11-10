"use client";

import { memo } from "react";
import { CORRELATION, REGIONS, annualTotal, type Scope, type Species } from "@/lib/data";
import { corrTextColor, fmt, signed, trendColor } from "@/lib/format";

const YEAR = 2025;
const BASE_YEAR = 2016;

/** One row per region: landings, change since 2016, and correlation with SST. Click to switch scope. */
export const RegionTable = memo(function RegionTable({ species, scope, onScope }: { species: Species; scope: Scope; onScope: (s: Scope) => void }) {
  return (
    <>
      <div className="label mb-2">By region · {YEAR}</div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-[11px] text-ink-3">
            <th className="pb-1.5 font-normal">Region</th>
            <th className="pb-1.5 text-right font-normal">t</th>
            <th className="pb-1.5 text-right font-normal">vs &apos;16</th>
            <th className="pb-1.5 text-right font-normal">r SST</th>
          </tr>
        </thead>
        <tbody>
          {REGIONS.map((r) => {
            const now = annualTotal(r.id, species.id, YEAR);
            const base = annualTotal(r.id, species.id, BASE_YEAR);
            const change = ((now - base) / base) * 100;
            const corr = CORRELATION[r.id][species.id].sst;
            return (
              <tr key={r.id} onClick={() => onScope(r.id)} className={`cursor-pointer border-t border-line ${scope === r.id ? "bg-hi" : "hover:bg-hi/60"}`}>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                    <span className="truncate">{r.name}</span>
                  </span>
                </td>
                <td className="py-2 text-right text-ink-2">{fmt(now)}</td>
                <td className="py-2 text-right" style={{ color: trendColor(change) }}>
                  {signed(change, 0)}%
                </td>
                <td className="py-2 text-right" style={{ color: corrTextColor(corr) }}>
                  {signed(corr)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
});
