"use client";

// Ranked horizontal bars: name, bar, value. Rows are buttons when `onPick`
// is given. Used for species rankings and province/region comparisons.
import { memo } from "react";

/** `color` overrides the bar colour (default: cerulean, or coral for negatives when diverging). */
export type BarRow = { id: string; name: string; value: number; sub?: string; selected?: boolean; note?: string; color?: string };

type Props = {
  rows: BarRow[];
  format: (n: number) => string;
  onPick?: (id: string) => void;
  /** Rows shown before "show all". */
  limit?: number;
  /** Signed values: bars grow both ways from a centre line. */
  diverging?: boolean;
};

export const BarList = memo(function BarList({ rows, format, onPick, limit, diverging }: Props) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-9);
  return (
    <ol className="-mx-2 space-y-px">
      {shown.map((r) => {
        const w = (Math.abs(r.value) / max) * (diverging ? 50 : 100);
        const bar = diverging ? { left: r.value < 0 ? `${50 - w}%` : "50%", width: `${w}%` } : { left: 0, width: `${w}%` };
        const body = (
          <>
            <span className="min-w-0">
              <span className={`block truncate ${r.selected ? "font-medium text-ink" : "text-ink-2"}`}>{r.name}</span>
              {r.sub && <span className="block truncate text-[11px] text-ink-3">{r.sub}</span>}
            </span>
            <span className="relative h-2 self-center rounded-full bg-hi">
              {diverging && <span className="absolute inset-y-[-3px] left-1/2 w-px bg-line-strong" />}
              <span className="absolute inset-y-0 rounded-full" style={{ ...bar, background: r.color ?? (diverging && r.value < 0 ? "var(--warm)" : "var(--accent-text)"), opacity: r.selected || !rows.some((x) => x.selected) ? 1 : 0.55 }} />
            </span>
            <span className="text-right text-ink-2">
              {format(r.value)}
              {r.note && <span className="block text-[10.5px] text-warm">{r.note}</span>}
            </span>
          </>
        );
        const cls = `grid w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-[12.5px] ${r.selected ? "bg-hi" : ""}`;
        const style = { gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr) 72px" };
        return (
          <li key={r.id}>
            {onPick ? (
              <button onClick={() => onPick(r.id)} className={`${cls} transition-colors hover:bg-hi`} style={style} aria-pressed={r.selected}>
                {body}
              </button>
            ) : (
              <div className={cls} style={style}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
});
