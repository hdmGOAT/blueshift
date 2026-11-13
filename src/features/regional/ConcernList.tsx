import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { DECLINE_PCT, ENV_ALERT, SHARP_DECLINE_PCT, type AreaRow } from "@/lib/analysis";
import type { Layer } from "@/lib/data";
import { signed } from "@/lib/format";
import { VARIABLE } from "@/lib/units";

/** Provinces flagged by the simple concern rules, with the reason and figures. */
export const ConcernList = memo(function ConcernList({ rows, layer, onPick }: { rows: AreaRow[]; layer: Layer; onPick: (id: string) => void }) {
  const v = VARIABLE[layer];
  const flagged = rows.filter((r) => r.concern).sort((a, b) => (a.yieldChangePct ?? 0) - (b.yieldChangePct ?? 0));
  const rule = `${layer === "sst" ? `warming over +${ENV_ALERT.sst}` : `chlorophyll falling over ${ENV_ALERT.chl}`} ${v.unit}/decade with landings down over ${-DECLINE_PCT}%, or landings down over ${-SHARP_DECLINE_PCT}%`;
  return (
    <Card title="Potential areas of concern" sub={`Rule: ${rule}. A prompt to look closer, not a diagnosis.`}>
      {flagged.length === 0 ? (
        <p className="text-[12.5px] text-ink-3">No province meets the rule for this selection.</p>
      ) : (
        <ul className="-mx-2 space-y-px">
          {flagged.map((r) => (
            <li key={r.id}>
              <button onClick={() => onPick(r.id)} className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-hi">
                <span>
                  <span className="text-ink">{r.name}</span> <span className="text-ink-3">· {r.concern}</span>
                </span>
                <span className="shrink-0 text-ink-2">
                  {signed(r.envPerDecade, v.digits)} {v.unit}/dec · <span className="text-warm">{signed(r.yieldChangePct ?? 0, 1)}%</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
});
