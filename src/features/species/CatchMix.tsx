"use client";

import { memo } from "react";
import { catchMix, quarterLabel, type Scope } from "@/lib/data";
import { fmt } from "@/lib/format";

const ROWS = 5;

type Props = { scope: Scope; index: number; selectedId: string; onSelect: (id: string) => void };

/** What is landed in the current scope this quarter: total, share bar, top species. */
export const CatchMix = memo(function CatchMix({ scope, index, selectedId, onSelect }: Props) {
  const mix = catchMix(scope, index);
  const total = mix.reduce((a, m) => a + m.v, 0);
  const shown = mix.slice(0, ROWS);
  const rest = mix.slice(ROWS).reduce((a, m) => a + m.share, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[20px] font-medium">{fmt(total)} t</span>
        <span className="text-[11.5px] text-ink-3">
          {mix.length} species · {quarterLabel(index)}
        </span>
      </div>
      <div className="mt-2.5 flex h-2 gap-px overflow-hidden rounded-full">
        {shown.map((m, i) => (
          <button
            key={m.s.id}
            onClick={() => onSelect(m.s.id)}
            title={`${m.s.local} ${(m.share * 100).toFixed(1)}%`}
            aria-label={`Select ${m.s.local}`}
            className="bg-accent-text"
            style={{ width: `${(m.share * 100).toFixed(2)}%`, opacity: m.s.id === selectedId ? 1 : 0.85 - i * 0.11 }}
          />
        ))}
        <span style={{ width: `${(rest * 100).toFixed(2)}%` }} className="bg-hi" />
      </div>
      <ol className="-mx-2 mt-2.5">
        {shown.map((m) => {
          const active = m.s.id === selectedId;
          return (
            <li key={m.s.id}>
              <button
                onClick={() => onSelect(m.s.id)}
                style={{ gridTemplateColumns: "1fr auto 44px" }}
                className={`grid w-full items-baseline gap-3 rounded-lg px-2 py-1 text-left text-[13px] transition-colors ${active ? "bg-hi text-ink" : "text-ink-2 hover:bg-hi"}`}
              >
                <span className={active ? "font-medium" : ""}>{m.s.local}</span>
                <span className="text-[12px] text-ink-3">{fmt(m.v)} t</span>
                <span className="text-right text-[12px]">{(m.share * 100).toFixed(1)}%</span>
              </button>
            </li>
          );
        })}
        <li className="px-2 pt-1 text-[11.5px] text-ink-3">
          +{mix.length - shown.length} more · {(rest * 100).toFixed(1)}%
        </li>
      </ol>
    </div>
  );
});
