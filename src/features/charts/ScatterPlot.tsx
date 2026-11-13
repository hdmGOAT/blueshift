"use client";

// Scatterplot of paired values with the fitted regression line. Each dot is
// one period; hovering names it and gives both values.
import { memo, useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { stepOf, tick } from "./axis";
import { useWidth } from "./useWidth";

export type Point = { x: number; y: number; label: string; note?: string };

type Props = {
  points: Point[];
  /** Fitted line y = intercept + slope * x; omitted when there is no fit. */
  fit?: { slope: number; intercept: number } | null;
  xLabel: string;
  yLabel: string;
  formatX: (n: number) => string;
  formatY: (n: number) => string;
  height?: number;
};

const M = { top: 12, right: 14, bottom: 40, left: 52 };

const extent = (vs: number[]) => {
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const pad = (hi - lo) * 0.08 || 1;
  return [lo - pad, hi + pad];
};

export const ScatterPlot = memo(function ScatterPlot({ points, fit, xLabel, yLabel, formatX, formatY, height = 420 }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const g = useMemo(() => {
    const x = scaleLinear().domain(extent(points.map((p) => p.x))).range([M.left, width - M.right]).nice(5);
    const y = scaleLinear().domain(extent(points.map((p) => p.y))).range([height - M.bottom, M.top]).nice(5);
    return { x, y };
  }, [points, width, height]);

  const { x, y } = g;
  const [x0, x1] = x.domain();
  const p = hover !== null ? points[hover] : null;

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label={`Scatterplot of ${yLabel} against ${xLabel}`} className="block" onPointerLeave={() => setHover(null)}>
        <defs>
          <clipPath id="scatter-plot-area">
            <rect x={M.left} y={M.top} width={width - M.left - M.right} height={height - M.top - M.bottom} />
          </clipPath>
        </defs>
        {y.ticks(5).map((t, _, all) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={M.left - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="var(--ink-3)">
              {tick(t, stepOf(all))}
            </text>
          </g>
        ))}
        {x.ticks(6).map((t, _, all) => (
          <text key={`x${t}`} x={x(t)} y={height - M.bottom + 14} textAnchor="middle" fontSize={10} fill="var(--ink-3)">
            {tick(t, stepOf(all))}
          </text>
        ))}
        <text x={(M.left + width - M.right) / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--ink-2)">
          {xLabel}
        </text>
        <text transform={`translate(12 ${(M.top + height - M.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="var(--ink-2)">
          {yLabel}
        </text>

        {fit && (
          <line
            x1={x(x0)} y1={y(fit.intercept + fit.slope * x0)} x2={x(x1)} y2={y(fit.intercept + fit.slope * x1)}
            stroke="var(--white)" strokeWidth={2} strokeDasharray="6 4" clipPath="url(#scatter-plot-area)"
          />
        )}
        {points.map((pt, i) => (
          <circle
            key={pt.label}
            cx={x(pt.x)}
            cy={y(pt.y)}
            r={hover === i ? 6 : 4.5}
            fill="var(--accent-text)"
            fillOpacity={hover === null || hover === i ? 0.85 : 0.35}
            stroke="var(--paper)"
            strokeWidth={2}
          />
        ))}
        {/* larger invisible targets */}
        {points.map((pt, i) => (
          <circle key={`hit-${pt.label}`} cx={x(pt.x)} cy={y(pt.y)} r={11} fill="transparent" onPointerEnter={() => setHover(i)} />
        ))}
      </svg>
      {p && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-line-strong bg-glass-strong px-2.5 py-1.5 text-[12px] shadow-xl backdrop-blur"
          style={{ left: Math.min(x(p.x) + 12, width - 190), top: Math.max(0, y(p.y) - 56) }}
        >
          <div className="font-medium text-ink">{p.label}</div>
          {p.note && <div className="text-ink-3">{p.note}</div>}
          <div className="mt-0.5 text-ink-2">
            x {formatX(p.x)} · y {formatY(p.y)}
          </div>
        </div>
      )}
    </div>
  );
});
