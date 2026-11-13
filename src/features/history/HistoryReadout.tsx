import { regionName, type Scope } from "@/lib/data";
import { fmt, signed, trendColor } from "@/lib/format";
import type { Grain, Row } from "./rows";

/** Line above the chart: the hovered period's figures, or the scope name. */
export function HistoryReadout({ row, scope, grain }: { row: Row | null; scope: Scope; grain: Grain }) {
  return (
    <div className="mb-2 flex h-10 items-end justify-between gap-4">
      <div>
        <div className="label">{row ? row.label : `${grain === "q" ? "Quarterly" : "Annual"} landings, t`}</div>
        <div className="font-display text-[22px] font-medium leading-tight">
          {row ? (
            <>
              {fmt(row.total)} t{" "}
              {row.yoy !== null && (
                <span className="text-[13px]" style={{ color: trendColor(row.yoy) }}>
                  {signed(row.yoy, 1)}% YoY
                </span>
              )}
              {row.partial && <span className="ml-2 text-[12px] text-ink-3">Q1–Q3 only</span>}
            </>
          ) : (
            <span className="text-ink-2">{regionName(scope)}</span>
          )}
        </div>
      </div>
      {row && (
        <div className="flex gap-4 text-right text-[12px]">
          <div>
            <div className="text-ink-3">SST</div>
            <div className="font-medium">{row.sst.toFixed(2)}°C</div>
          </div>
          <div>
            <div className="text-ink-3">Chl-a</div>
            <div className="font-medium">{row.chl.toFixed(3)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
