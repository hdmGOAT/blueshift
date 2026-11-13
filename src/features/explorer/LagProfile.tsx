import { memo } from "react";
import { corrColor } from "@/lib/colors";
import type { LagRow } from "@/lib/analysis";
import { signed } from "@/lib/format";

type Props = { rows: LagRow[]; current: number; unit: string; onPick: (lag: number) => void };

/** Pearson r at each lag, as diverging bars. Click a row to analyse that lag. */
export const LagProfile = memo(function LagProfile({ rows, current, unit, onPick }: Props) {
  return (
    <ol className="space-y-1">
      {rows.map((r) => {
        const w = Math.min(50, Math.abs(r.r) * 50);
        return (
          <li key={r.lag}>
            <button
              onClick={() => onPick(r.lag)}
              aria-pressed={r.lag === current}
              className={`grid w-full items-center gap-3 rounded-lg px-2 py-1 text-left text-[12px] hover:bg-hi ${r.lag === current ? "bg-hi text-ink" : "text-ink-2"}`}
              style={{ gridTemplateColumns: "74px 1fr 92px" }}
            >
              <span>{r.lag === 0 ? "Same period" : `${r.lag} ${unit}`}</span>
              <span className="relative h-2 rounded-full bg-hi">
                <span className="absolute inset-y-[-3px] left-1/2 w-px bg-line-strong" />
                <span className="absolute inset-y-0 rounded-full" style={{ left: r.r < 0 ? `${50 - w}%` : "50%", width: `${w}%`, background: corrColor(r.r) }} />
              </span>
              <span className="text-right">
                r {signed(r.r)} <span className="text-ink-3">{r.p < 0.05 ? "*" : ""}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
});
