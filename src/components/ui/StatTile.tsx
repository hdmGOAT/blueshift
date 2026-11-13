import type { ReactNode } from "react";

/** One headline number with a label above and context below. */
export function StatTile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="label">{label}</div>
      <div className="font-display mt-1 text-[26px] font-medium leading-tight" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11.5px] text-ink-3">{sub}</div>}
    </div>
  );
}
