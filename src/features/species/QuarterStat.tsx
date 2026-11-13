import { LAST_COMPLETE_YEAR, YIELDS, annualTotal, quarterLabel, type Scope, type Species } from "@/lib/data";
import { fmt, signed, trendColor } from "@/lib/format";

/** Two figures under the trend chart: the selected quarter (with YoY) and the last complete year's total. */
export function QuarterStat({ species, scope, index }: { species: Species; scope: Scope; index: number }) {
  const ys = YIELDS[scope][species.id];
  const now = ys[index].value;
  const prev = index >= 4 ? ys[index - 4].value : 0;
  const yoy = prev ? ((now - prev) / prev) * 100 : null;
  return (
    <dl className="mt-2 grid grid-cols-2 gap-3 border-t border-line pt-3">
      <div>
        <dt className="text-[11px] text-ink-3">{quarterLabel(index)}</dt>
        <dd className="mt-0.5 text-[15px] font-medium">
          {fmt(now)} t
          {yoy !== null && (
            <span className="ml-1.5 text-[11.5px] font-normal" style={{ color: trendColor(yoy) }}>
              {signed(yoy, 1)}% YoY
            </span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] text-ink-3">{LAST_COMPLETE_YEAR} total</dt>
        <dd className="mt-0.5 text-[15px] font-medium">{fmt(annualTotal(scope, species.id, LAST_COMPLETE_YEAR))} t</dd>
      </div>
    </dl>
  );
}
