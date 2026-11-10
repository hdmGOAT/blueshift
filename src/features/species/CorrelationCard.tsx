"use client";

import { memo } from "react";
import { CORR_GRADIENT } from "@/lib/colors";
import { CORRELATION, LAST_OBSERVED, regionName, strengthLabel, type Scope, type Species } from "@/lib/data";
import { corrTextColor, signed } from "@/lib/format";

/** A −1..+1 track with a marker at r. */
function Meter({ r }: { r: number }) {
  return (
    <div className="relative mt-2 h-4">
      <div className="absolute inset-x-0 top-[6px] h-1 rounded-full" style={{ background: CORR_GRADIENT }} />
      <div className="absolute left-1/2 top-[4px] h-2 w-px bg-ink-3" />
      <div
        className="absolute top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-prussian shadow"
        style={{ left: `${(((r + 1) / 2) * 100).toFixed(2)}%`, transition: "left 300ms" }}
      />
    </div>
  );
}

const VARIABLES = [
  ["sst", "Sea surface temp."],
  ["chl", "Chlorophyll-a"],
] as const;

/** Correlation of one species' landings with each ocean variable. */
export const CorrelationCard = memo(function CorrelationCard({ species, scope }: { species: Species; scope: Scope }) {
  const corr = CORRELATION[scope][species.id];
  return (
    <div className="space-y-5">
      {VARIABLES.map(([key, label]) => (
        <div key={key}>
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-ink-2">{label}</span>
            <span className="font-display text-[22px] font-medium leading-none" style={{ color: corrTextColor(corr[key]) }}>
              {signed(corr[key])}
            </span>
          </div>
          <Meter r={corr[key]} />
          <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-3">
            <span>−1</span>
            <span className="text-ink-2">{strengthLabel(corr[key])}</span>
            <span>+1</span>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-ink-3">
        {LAST_OBSERVED + 1} quarters · seasonally adjusted · {regionName(scope)}
      </p>
    </div>
  );
});
