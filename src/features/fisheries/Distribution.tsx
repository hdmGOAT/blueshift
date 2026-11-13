import { memo } from "react";
import type { Habitat } from "@/lib/data";
import { fmt } from "@/lib/format";

// Fixed colour per habitat (follows the entity, not its rank).
const COLOR: Record<Habitat, string> = { Pelagic: "var(--series-1)", Reef: "var(--series-2)", Aquaculture: "var(--series-3)", Freshwater: "var(--series-5)" };

/** A single stacked bar of shares, with a labelled legend underneath. */
export const Distribution = memo(function Distribution({ rows }: { rows: { habitat: Habitat; total: number; share: number }[] }) {
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Production share by habitat">
        {rows.map((r) => (
          <span key={r.habitat} title={`${r.habitat} ${(r.share * 100).toFixed(1)}%`} style={{ width: `${r.share * 100}%`, background: COLOR[r.habitat] }} />
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-[12.5px]">
        {rows.map((r) => (
          <li key={r.habitat} className="grid items-center gap-2" style={{ gridTemplateColumns: "10px 1fr auto 48px" }}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR[r.habitat] }} />
            <span className="text-ink-2">{r.habitat}</span>
            <span className="text-ink-3">{fmt(r.total)} t</span>
            <span className="text-right text-ink">{(r.share * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
