import { FORECAST_INDEX, YIELDS, quarterLabel, type Scope, type Species } from "@/lib/data";
import { fmt, signed, trendColor } from "@/lib/format";

/** Two figures under the trend chart: the selected quarter and the Q4 2026 forecast. */
export function Outlook({ species, scope, index }: { species: Species; scope: Scope; index: number }) {
  const ys = YIELDS[scope][species.id];
  const now = ys[index].value;
  const yoy = index >= 4 ? ((now - ys[index - 4].value) / ys[index - 4].value) * 100 : null;
  const forecast = ys[FORECAST_INDEX];
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
        <dt className="text-[11px] text-ink-3">{quarterLabel(FORECAST_INDEX)} outlook</dt>
        <dd className="mt-0.5 text-[15px] font-medium text-forecast">
          {fmt(forecast.value)} t <span className="text-[11.5px] font-normal text-ink-3">±{fmt(forecast.high! - forecast.value)}</span>
        </dd>
      </div>
    </dl>
  );
}
