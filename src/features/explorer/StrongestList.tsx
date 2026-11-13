"use client";

// The strongest relationships in the data for the selected years (from
// /api/highlights). Click one to load it into the Explorer.
import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { corrColor } from "@/lib/colors";
import { fmtP, toQuery, type Highlight, type HighlightsResult } from "@/lib/analysis";
import { signed } from "@/lib/format";
import { VARIABLE } from "@/lib/units";
import { useApi } from "@/lib/useApi";

type Current = { species: string; area: string; variable: string; lag: number };
type Props = { years: [number, number]; current: Current; onPick: (h: Highlight) => void };

const isCurrent = (h: Highlight, c: Current) => h.params.species === c.species && h.params.area === c.area && h.params.variable === c.variable && h.params.lag === c.lag;

export const StrongestList = memo(function StrongestList({ years, current, onPick }: Props) {
  const { data, error } = useApi<HighlightsResult>("/api/highlights", toQuery({ from: years[0], to: years[1] }));
  return (
    <Card
      title="Strongest relationships"
      sub={
        data
          ? `Best lag of each species × area × variable, ${years[0]}–${years[1]}, seasonal cycle removed. ${data.significant} of ${data.tests} tests pass q < 0.05 (adjusted for testing many at once).`
          : "Searching every species, area, variable and lag…"
      }
    >
      {error && <p className="text-[12px] text-warm">{error}</p>}
      <ol className="-mx-2 space-y-px">
        {data?.top.map((h) => {
          const active = isCurrent(h, current);
          return (
            <li key={`${h.params.species}-${h.params.area}-${h.params.variable}`}>
              <button
                onClick={() => onPick(h)}
                aria-pressed={active}
                className={`grid w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-hi ${active ? "bg-hi" : ""}`}
                style={{ gridTemplateColumns: "8px minmax(0,1fr) auto" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: corrColor(h.r) }} />
                <span className="min-w-0">
                  <span className={`block truncate ${active ? "font-medium text-ink" : "text-ink-2"}`}>
                    {h.speciesName} · {h.areaName}
                  </span>
                  <span className="block truncate text-[11px] text-ink-3">
                    {VARIABLE[h.params.variable].name}
                    {h.params.lag ? `, ${h.params.lag}q earlier` : ", same quarter"} · n {h.n}
                    {h.flagged && <span className="text-warm"> · data note</span>}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-ink">r {signed(h.r)}</span>
                  <span className="block text-[11px] text-ink-3">{fmtP(h.p)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
});
