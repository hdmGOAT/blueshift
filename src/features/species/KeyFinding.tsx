"use client";

import { memo } from "react";
import { Block } from "@/components/ui/Block";
import { CORRELATION, SPECIES, annualTotal, regionName, type Scope } from "@/lib/data";
import { signed, trendColor } from "@/lib/format";

/** Headline for the current scope: the species most hurt by warming water. */
export const KeyFinding = memo(function KeyFinding({ scope, onSelect }: { scope: Scope; onSelect: (id: string) => void }) {
  const corr = CORRELATION[scope];
  const s = SPECIES.reduce((worst, x) => (corr[x.id].sst < corr[worst.id].sst ? x : worst));
  const y16 = annualTotal(scope, s.id, 2016);
  const pct = ((annualTotal(scope, s.id, 2025) - y16) / y16) * 100;
  return (
    <Block title={`Key finding · ${regionName(scope)}`}>
      <button onClick={() => onSelect(s.id)} className="group flex w-full items-end justify-between gap-3 text-left">
        <div>
          <div className="text-[15px] font-medium text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{s.local}</div>
          <div className="mt-0.5 text-[12px] text-ink-3">
            Landings 2016 → 2025 · r <span className="text-warm">{signed(corr[s.id].sst)}</span> with sea temp
          </div>
        </div>
        <div className="font-display text-[40px] font-medium leading-[0.9]" style={{ color: trendColor(pct) }}>
          {pct < 0 ? "−" : "+"}
          {Math.abs(pct).toFixed(0)}
          <span className="text-[22px]">%</span>
        </div>
      </button>
    </Block>
  );
});
