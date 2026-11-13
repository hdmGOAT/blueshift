"use client";

// Line chart over periods with one y-axis, a hover crosshair and tooltip.
// Two or more series get a legend and direct end labels (identity is never
// colour alone). Never draw two measures with different units here: use two charts.
// A null value is "not recorded": the line breaks there instead of dropping to zero.
import { memo, useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { stepOf, tick, xTickText, xTicks } from "./axis";
import { useWidth } from "./useWidth";

export type Series = { id: string; name: string; color: string; values: (number | null)[] };

const lastKnown = (vs: (number | null)[]) => {
  for (let i = vs.length - 1; i >= 0; i--) if (vs[i] !== null) return vs[i] as number;
  return null;
};

type Props = {
  labels: string[];
  series: Series[];
  /** Value text in the tooltip, e.g. (n) => `${n.toFixed(2)} °C`. */
  format: (n: number) => string;
  ariaLabel: string;
  height?: number;
  /** Start the y-axis at zero (totals) instead of fitting the data (levels). */
  zero?: boolean;
  /** A dashed horizontal reference, e.g. the baseline mean. */
  reference?: { value: number; label: string };
};

const M = { top: 10, left: 40, bottom: 22 };

export const LineChart = memo(function LineChart({ labels, series, format, ariaLabel, height = 200, zero, reference }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const multi = series.length > 1;
  const right = multi ? 84 : 10;

  const g = useMemo(() => {
    const all = (series.flatMap((s) => s.values).filter((v) => v !== null) as number[]).concat(reference ? [reference.value] : []);
    if (!all.length) all.push(0, 1);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.05 || 1;
    const y = scaleLinear().domain([zero ? 0 : lo - pad, hi + pad]).range([height - M.bottom, M.top]).nice(4);
    const x = scaleLinear().domain([0, Math.max(1, labels.length - 1)]).range([M.left, width - right]);
    const gen = line<number | null>().defined((v) => v !== null).x((_, i) => x(i)).y((v) => y(v as number));
    return { x, y, paths: series.map((s) => gen(s.values) ?? ""), ticks: xTicks(labels, width - M.left - right) };
  }, [series, labels, width, height, zero, right, reference]);

  const { x, y } = g;
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(x.invert(e.clientX - box.left + M.left));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };
  const tipLeft = hover !== null ? Math.min(x(hover) + 12, width - 170) : 0;

  return (
    <div ref={ref} className="relative w-full">
      {multi && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-2">
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
        {g.y.ticks(4).map((t, _, all) => (
          <g key={t}>
            <line x1={M.left} x2={width - right} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={M.left - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="var(--ink-3)">
              {tick(t, stepOf(all))}
            </text>
          </g>
        ))}
        {reference && (
          <g>
            <line x1={M.left} x2={width - right} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--ink-3)" strokeDasharray="3 4" />
            <text x={width - right - 2} y={y(reference.value) - 4} textAnchor="end" fontSize={10} fill="var(--ink-3)">
              {reference.label}
            </text>
          </g>
        )}
        {g.ticks.map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--ink-3)">
            {xTickText(labels[i])}
          </text>
        ))}
        {series.map((s, si) => (
          <path key={s.id} d={g.paths[si]} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {multi &&
          series.map((s) => (
            <text key={s.id} x={width - right + 6} y={y(lastKnown(s.values) ?? 0) + 3} fontSize={10.5} fill="var(--ink-2)">
              {s.name.length > 12 ? `${s.name.slice(0, 11)}…` : s.name}
            </text>
          ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={height - M.bottom} stroke="var(--line-strong)" />
            {series.map((s) => {
              const v = s.values[hover];
              return v === null ? null : <circle key={s.id} cx={x(hover)} cy={y(v)} r={4} fill={s.color} stroke="var(--paper)" strokeWidth={2} />;
            })}
          </g>
        )}
        <rect x={M.left} y={0} width={Math.max(0, width - right - M.left)} height={height} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute z-10 min-w-[150px] rounded-lg border border-line-strong bg-glass-strong px-2.5 py-1.5 text-[12px] shadow-xl backdrop-blur" style={{ left: tipLeft, top: multi ? 28 : 4 }}>
          <div className="mb-0.5 text-ink-3">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-ink-2">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
              <span className="font-medium text-ink">{s.values[hover] === null ? <span className="font-normal text-ink-3">not recorded</span> : format(s.values[hover] as number)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
