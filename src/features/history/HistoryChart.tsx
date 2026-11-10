"use client";

// The big chart in the history modal. Quarterly = stacked areas by region
// with a total line and the forecast point; annual = stacked bars. Two strips
// underneath show the SST and chlorophyll anomaly for each period.
import { memo, useMemo } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line, stack, type SeriesPoint } from "d3-shape";
import { stripeColor } from "@/lib/colors";
import { FORECAST_INDEX, LAST_OBSERVED, QUARTERS, YIELDS, type Region, type RegionId, type Scope, type Species } from "@/lib/data";
import type { Grain, Row } from "./rows";

// Layout in viewBox units.
const W = 760;
const TOP = 10;
const PLOT_H = 250;
const LEFT = 40;
const RIGHT = 8;
const STRIP_H = 14;
const STRIPS_Y = TOP + PLOT_H + 26;
const H = STRIPS_Y + STRIP_H * 2 + 16;
const STRIPS = [
  ["sst", "SST"],
  ["chl", "Chl"],
] as const;

type Props = {
  species: Species;
  scope: Scope;
  grain: Grain;
  rows: Row[];
  /** Regions being stacked (all six, or the selected one). */
  regions: Region[];
  /** Index into `rows` under the cursor. */
  hover: number | null;
  onHover: (i: number | null) => void;
};

export const HistoryChart = memo(function HistoryChart({ species, scope, grain, rows, regions, hover, onHover }: Props) {
  // Scales and paths depend only on the rows, so hovering does not rebuild them.
  const g = useMemo(() => {
    const y = scaleLinear().domain([0, Math.max(...rows.map((r) => r.total)) * 1.06]).range([TOP + PLOT_H, TOP]).nice(4);
    const band = scaleBand<number>().domain(rows.map((_, i) => i)).range([LEFT, W - RIGHT]).paddingInner(grain === "y" ? 0.28 : 0.12);
    const xc = (i: number) => band(i)! + band.bandwidth() / 2;
    const stacked = stack<Row, RegionId>().keys(regions.map((r) => r.id)).value((d, k) => d.byRegion[k])(rows);
    // Quarterly charts draw observed quarters only; the forecast is a separate marker.
    const observed = grain === "q" ? LAST_OBSERVED + 1 : rows.length;
    const areaGen = area<SeriesPoint<Row>>().x((_, i) => xc(i)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(curveMonotoneX);
    return {
      y,
      band,
      xc,
      stacked,
      areas: grain === "q" ? stacked.map((layer) => areaGen(layer.slice(0, observed)) ?? "") : [],
      totalLine: grain === "q" ? (line<Row>().x((_, i) => xc(i)).y((d) => y(d.total)).curve(curveMonotoneX)(rows.slice(0, observed)) ?? "") : "",
    };
  }, [rows, regions, grain]);

  const { y, band, xc } = g;
  const forecast = YIELDS[scope][species.id][FORECAST_INDEX];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => onHover(null)} role="img" aria-label={`${species.local} landings history`}>
      {y.ticks(4).map((t) => (
        <g key={t}>
          <line x1={LEFT} x2={W - RIGHT} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={LEFT - 8} y={y(t) + 3} textAnchor="end" fontSize={10} fill="var(--ink-3)">
            {t >= 1000 ? `${t / 1000}k` : t}
          </text>
        </g>
      ))}

      {grain === "y"
        ? g.stacked.map((layer, li) => (
            <g key={layer.key} fill={regions[li].color}>
              {layer.map((d, i) => (
                <rect
                  key={i}
                  x={band(i)}
                  y={y(d[1])}
                  width={band.bandwidth()}
                  height={Math.max(0, y(d[0]) - y(d[1]))}
                  opacity={rows[i].projected ? 0.45 : hover === null || hover === i ? 0.95 : 0.55}
                  rx={li === g.stacked.length - 1 ? 2 : 0}
                />
              ))}
            </g>
          ))
        : g.areas.map((d, li) => <path key={regions[li].id} d={d} fill={regions[li].color} opacity={0.85} stroke="var(--modal)" strokeWidth={0.6} />)}

      {grain === "q" && (
        <>
          <path d={g.totalLine} fill="none" stroke="var(--white)" strokeWidth={1.4} />
          <line x1={xc(LAST_OBSERVED)} y1={y(rows[LAST_OBSERVED].total)} x2={xc(FORECAST_INDEX)} y2={y(forecast.value)} stroke="var(--forecast)" strokeWidth={1.4} strokeDasharray="2 3" />
          <line x1={xc(FORECAST_INDEX)} x2={xc(FORECAST_INDEX)} y1={y(forecast.high!)} y2={y(forecast.low!)} stroke="var(--forecast)" strokeWidth={2} strokeLinecap="round" />
          <circle cx={xc(FORECAST_INDEX)} cy={y(forecast.value)} r={3.5} fill="var(--modal)" stroke="var(--forecast)" strokeWidth={1.6} />
        </>
      )}

      {STRIPS.map(([layer, label], si) => {
        const sy = STRIPS_Y + si * (STRIP_H + 2);
        return (
          <g key={layer}>
            <text x={LEFT - 8} y={sy + 10} textAnchor="end" fontSize={9.5} fill="var(--ink-3)">
              {label}
            </text>
            {rows.map((r, i) => (
              <rect key={i} x={band(i)} y={sy} width={band.bandwidth()} height={STRIP_H} rx={1.5} fill={stripeColor(layer, r)} />
            ))}
          </g>
        );
      })}

      {/* x labels: every year */}
      {rows.map((r, i) =>
        grain === "y" ? (
          <text key={r.key} x={xc(i)} y={H - 2} textAnchor="middle" fontSize={10} fill="var(--ink-3)">
            {r.label}
          </text>
        ) : QUARTERS[i].q === 1 ? (
          <text key={r.key} x={band(i)} y={H - 2} fontSize={10} fill="var(--ink-3)">
            {QUARTERS[i].year}
          </text>
        ) : null,
      )}

      {hover !== null && <line x1={xc(hover)} x2={xc(hover)} y1={TOP} y2={TOP + PLOT_H} stroke="rgba(254,252,251,0.5)" />}

      {/* invisible columns that report which period is under the cursor */}
      {rows.map((_, i) => (
        <rect key={i} x={band(i)! - (band.step() - band.bandwidth()) / 2} y={0} width={band.step()} height={H} fill="transparent" onMouseEnter={() => onHover(i)} />
      ))}
    </svg>
  );
});
