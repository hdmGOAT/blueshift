"use client";

// Small chart: quarterly landings for one species
// above an ocean-anomaly strip, with a cursor at the selected quarter.
import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { LAST_OBSERVED, OCEAN, YIELDS, type Layer, type Scope, type Species, type YieldPoint } from "@/lib/data";

// Layout in viewBox units.
const W = 300;
const PLOT_H = 96; // landings plot
const STRIP_H = 36; // anomaly strip
const GAP = 14;
const LEFT = 30;
const RIGHT = 6;
const H = PLOT_H + GAP + STRIP_H + 18;
const YEAR_TICKS = [2016, 2019, 2022, 2025];

type Props = { species: Species; scope: Scope; index: number; layer: Layer };

export function TrendChart({ species, scope, index, layer }: Props) {
  // Everything except the cursor depends only on these three, so the paths
  // are not rebuilt while the timeline plays.
  const g = useMemo(() => {
    const data = YIELDS[scope][species.id];
    const x = scaleLinear().domain([0, LAST_OBSERVED]).range([LEFT, W - RIGHT]);
    const vals = data.map((p) => p.value);
    const y = scaleLinear().domain([Math.min(...vals) * 0.94, Math.max(...vals) * 1.03]).range([PLOT_H, 6]).nice(3);
    const observed = data.slice(0, LAST_OBSERVED + 1);

    const anoms = OCEAN[scope].map((o) => (layer === "sst" ? o.sstAnom : o.chlAnom));
    const extent = Math.max(...anoms.map(Math.abs));
    const oy = scaleLinear().domain([-extent, extent]).range([PLOT_H + GAP + STRIP_H, PLOT_H + GAP]);

    return {
      data,
      x,
      y,
      zeroY: oy(0),
      linePath: line<YieldPoint>().x((p) => x(p.index)).y((p) => y(p.value)).curve(curveMonotoneX)(observed)!,
      fillPath: area<YieldPoint>().x((p) => x(p.index)).y0(PLOT_H).y1((p) => y(p.value)).curve(curveMonotoneX)(observed)!,
      anomalyPath: area<number>().x((_, i) => x(i)).y0(oy(0)).y1((v) => oy(v)).curve(curveMonotoneX)(anoms.slice(0, LAST_OBSERVED + 1))!,
    };
  }, [species.id, scope, layer]);

  const { data, x, y } = g;
  const uid = `${species.id}-${scope}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${species.local} quarterly landings`}>
      <defs>
        <linearGradient id={`fill-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--accent-text)", stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: "var(--accent-text)", stopOpacity: 0 }} />
        </linearGradient>
        <clipPath id={`above-${uid}`}>
          <rect x={0} y={0} width={W} height={g.zeroY} />
        </clipPath>
        <clipPath id={`below-${uid}`}>
          <rect x={0} y={g.zeroY} width={W} height={H} />
        </clipPath>
      </defs>

      {y.ticks(3).map((t) => (
        <g key={t}>
          <line x1={LEFT} x2={W - RIGHT} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={LEFT - 6} y={y(t) + 3} textAnchor="end" fontSize={9.5} fill="var(--ink-3)">
            {t >= 1000 ? `${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : t}
          </text>
        </g>
      ))}

      {/* landings */}
      <path d={g.fillPath} fill={`url(#fill-${uid})`} />
      <path d={g.linePath} fill="none" stroke="var(--accent-text)" strokeWidth={1.6} />

      {/* ocean anomaly: above normal one colour, below another */}
      <line x1={LEFT} x2={W - RIGHT} y1={g.zeroY} y2={g.zeroY} stroke="var(--line-strong)" />
      <path d={g.anomalyPath} fill={layer === "sst" ? "var(--warm)" : "#5fae5f"} opacity={0.8} clipPath={`url(#above-${uid})`} />
      <path d={g.anomalyPath} fill={layer === "sst" ? "var(--cerulean)" : "#b9a477"} opacity={0.8} clipPath={`url(#below-${uid})`} />
      <text x={LEFT} y={PLOT_H + GAP - 2} fontSize={9.5} fill="var(--ink-3)">
        {layer === "sst" ? "SST anomaly" : "Chl-a anomaly"}
      </text>

      {/* cursor at the selected quarter */}
      <line x1={x(index)} x2={x(index)} y1={2} y2={PLOT_H + GAP + STRIP_H} stroke="rgba(254,252,251,0.5)" />
      <circle cx={x(index)} cy={y(data[index].value)} r={3.2} fill="var(--white)" />

      {YEAR_TICKS.map((yr) => (
        <text key={yr} x={x((yr - 2016) * 4)} y={H - 3} fontSize={9.5} fill="var(--ink-3)">
          {yr}
        </text>
      ))}
    </svg>
  );
}
