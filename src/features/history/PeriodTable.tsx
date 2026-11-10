"use client";

import { memo } from "react";
import { fmt, signed, trendColor } from "@/lib/format";
import type { Grain, Row } from "./rows";

type Props = { rows: Row[]; grain: Grain; hover: number | null; onHover: (i: number | null) => void };

/** Scrollable table of every period, newest first. Hover is linked to the chart. */
export const PeriodTable = memo(function PeriodTable({ rows, grain, hover, onHover }: Props) {
  return (
    <>
      <div className="label mb-2 mt-6">{grain === "q" ? "Quarters" : "Years"}</div>
      <div className="scroll-thin max-h-[260px] overflow-y-auto rounded-lg border border-line">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-modal-head text-[11px] text-ink-3">
            <tr>
              <th className="px-2.5 py-1.5 text-left font-normal">Period</th>
              <th className="px-2.5 py-1.5 text-right font-normal">t</th>
              <th className="px-2.5 py-1.5 text-right font-normal">YoY</th>
              <th className="px-2.5 py-1.5 text-right font-normal">SST</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .map((r, i) => (
                <tr key={r.key} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} className={`border-t border-line ${hover === i ? "bg-hi" : ""}`}>
                  <td className="px-2.5 py-1.5">
                    {r.label}
                    {r.projected && <span className="ml-1.5 text-[10.5px] text-forecast">proj.</span>}
                  </td>
                  <td className="px-2.5 py-1.5 text-right text-ink-2">{fmt(r.total)}</td>
                  <td className="px-2.5 py-1.5 text-right" style={{ color: r.yoy === null ? undefined : trendColor(r.yoy) }}>
                    {r.yoy === null ? "–" : `${signed(r.yoy, 1)}%`}
                  </td>
                  <td className="px-2.5 py-1.5 text-right text-ink-2">{r.sst.toFixed(2)}°</td>
                </tr>
              ))
              .reverse()}
          </tbody>
        </table>
      </div>
    </>
  );
});
