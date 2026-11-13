"use client";

import { memo } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { MAX_LAG, type Resolution } from "@/lib/analysis";

type Props = {
  resolution: Resolution;
  lag: number;
  setLag: (n: number) => void;
  deseason: boolean;
  setDeseason: (b: boolean) => void;
  detrend: boolean;
  setDetrend: (b: boolean) => void;
};

/** Lag and adjustment options specific to the Relationship Explorer. */
export const ExplorerOptions = memo(function ExplorerOptions({ resolution, lag, setLag, deseason, setDeseason, detrend, setDetrend }: Props) {
  const unit = resolution === "quarterly" ? "q" : "y";
  const lags = Array.from({ length: MAX_LAG[resolution] + 1 }, (_, i) => [String(i), i === 0 ? "Same period" : `${i}${unit}`] as [string, string]);
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
      <div className="flex items-center gap-2">
        <span className="label" id="lag-label">Ocean leads by</span>
        <Segmented size="sm" value={String(lag)} onChange={(v) => setLag(Number(v))} options={lags} />
      </div>
      <label className={`flex items-center gap-2 ${resolution === "annual" ? "opacity-40" : "text-ink-2"}`} title="Compare each quarter with the same quarter in other years">
        <input type="checkbox" checked={deseason && resolution === "quarterly"} disabled={resolution === "annual"} onChange={(e) => setDeseason(e.target.checked)} className="h-3.5 w-3.5" />
        Remove seasonal cycle
      </label>
      <label className="flex items-center gap-2 text-ink-2" title="Remove a straight-line trend from both series before correlating">
        <input type="checkbox" checked={detrend} onChange={(e) => setDetrend(e.target.checked)} className="h-3.5 w-3.5" />
        Remove long-term trend
      </label>
    </div>
  );
});
