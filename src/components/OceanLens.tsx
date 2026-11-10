"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule, geoMercator, geoPath, type GeoProjection } from "d3-geo";
import { scaleSqrt } from "d3-scale";
import type { Feature, FeatureCollection } from "geojson";
import mindanao from "@/data/mindanao.json";
import context from "@/data/context.json";
import { FIELD_BOUNDS, renderField } from "@/lib/field";
import {
  GROUNDS,
  REGIONS,
  catchMix,
  REGION_BY_PSGC,
  YIELDS,
  scopeMax,
  type Corr,
  type Layer,
  type RegionId,
  type Scope,
  type Species,
} from "@/lib/data";
import { corrColor } from "@/lib/colors";

const W = 900;
const H = 860;
const CX = W / 2;
const CY = H / 2 - 6;
const R = 236;
const RING = R + 64;
const K_MIN = 1;
const K_MAX = 10;

// Base projection: Mindanao fitted inside the lens. The view is expressed in
// base-pixel space as { x, y, k }: the base pixel shown at the lens center.
const base = geoMercator().fitExtent(
  [
    [CX - R * 0.94, CY - R * 0.84],
    [CX + R * 0.94, CY + R * 0.84],
  ],
  { type: "MultiPoint", coordinates: [[120.6, 4.9], [126.7, 10.0]] },
);
const basePath = geoPath(base);
const S0 = base.scale();
const [T0x, T0y] = base.translate();

type View = { x: number; y: number; k: number };

const projectionFor = (v: View): GeoProjection =>
  geoMercator()
    .scale(S0 * v.k)
    .translate([v.k * (T0x - v.x) + CX, v.k * (T0y - v.y) + CY]);
// Keep Mindanao filling the lens: the lens may only travel inside the land's
// bounding box. At the default zoom that pins the view in place.
const clampAxis = (c: number, lo: number, hi: number, half: number) =>
  lo + half > hi - half ? (lo + hi) / 2 : Math.min(hi - half, Math.max(lo + half, c));
const clampView = (v: View): View => {
  const k = Math.min(K_MAX, Math.max(K_MIN, v.k));
  const half = (R * 0.9) / k;
  return { k, x: clampAxis(v.x, LAND[0][0], LAND[1][0], half), y: clampAxis(v.y, LAND[0][1], LAND[1][1], half) };
};
const toBase = (v: View, sx: number, sy: number) => [(sx - CX) / v.k + v.x, (sy - CY) / v.k + v.y] as const;

const MIND = mindanao as FeatureCollection;
const CTX = context as FeatureCollection;
const LAND = basePath.bounds(MIND);
const HOME: View = clampView({ x: CX, y: CY, k: 1 });
const regionOf = (f: Feature) => REGION_BY_PSGC[(f.properties as { region: number }).region];
const REGION_FC = Object.fromEntries(
  REGIONS.map((r) => [r.id, { type: "FeatureCollection", features: MIND.features.filter((f) => regionOf(f) === r.id) } as FeatureCollection]),
) as Record<RegionId, FeatureCollection>;
const REGION_VIEW = Object.fromEntries(
  REGIONS.map((r) => {
    const [[x0, y0], [x1, y1]] = basePath.bounds(REGION_FC[r.id]);
    const k = Math.min(K_MAX, Math.max(1.3, (1.5 * R) / Math.max(x1 - x0, y1 - y0)));
    return [r.id, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, k }];
  }),
) as Record<RegionId, View>;
const NICE_KM = [10, 20, 25, 50, 100, 200];

type Props = {
  layer: Layer;
  index: number;
  scope: Scope;
  setScope: (s: Scope) => void;
  visible: Species[];
  selected: Species;
  onSelect: (id: string) => void;
  corr: Record<string, Corr>;
};

export function OceanLens({ layer, index, scope, setScope, visible, selected, onSelect, corr }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imgRef = useRef<SVGImageElement>(null);
  const [hover, setHover] = useState<{ region: RegionId; x: number; y: number } | null>(null);
  const [view, setView] = useState<View>(HOME);
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [hoverBubble, setHoverBubble] = useState<string | null>(null);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const anim = useRef<number | null>(null);
  const drag = useRef<{ sx: number; sy: number; vx: number; vy: number; moved: boolean; region: RegionId | null } | null>(null);

  useEffect(() => {
    imgRef.current?.setAttribute("href", renderField(layer, index));
  }, [layer, index]);

  const flyTo = useCallback((target: View, ms = 560) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    const from = viewRef.current;
    const to = clampView(target);
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      setView({
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        k: Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * e),
      });
      if (t < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  }, []);

  // follow scope changes made outside the map (header select, modal tabs)
  const lastScope = useRef(scope);
  useEffect(() => {
    if (lastScope.current === scope) return;
    lastScope.current = scope;
    flyTo(scope === "all" ? HOME : REGION_VIEW[scope], 700);
  }, [scope, flyTo]);

  const svgPoint = (clientX: number, clientY: number) => {
    const pt = new DOMPoint(clientX, clientY).matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
    return [pt.x, pt.y] as const;
  };
  const inLens = (sx: number, sy: number) => (sx - CX) ** 2 + (sy - CY) ** 2 <= R * R;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
      if ((pt.x - CX) ** 2 + (pt.y - CY) ** 2 > R * R) return;
      e.preventDefault();
      if (anim.current) cancelAnimationFrame(anim.current);
      const v = viewRef.current;
      const k = Math.min(K_MAX, Math.max(K_MIN, v.k * Math.exp(-e.deltaY * 0.0022)));
      const [bx, by] = toBase(v, pt.x, pt.y);
      setView(clampView({ k, x: bx - (pt.x - CX) / k, y: by - (pt.y - CY) / k }));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const [sx, sy] = svgPoint(e.clientX, e.clientY);
    if (!inLens(sx, sy)) return;
    // read the region before capture retargets later events to the <svg>
    const region = ((e.target as Element).closest("[data-region]")?.getAttribute("data-region") ?? null) as RegionId | null;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (anim.current) cancelAnimationFrame(anim.current);
    drag.current = { sx, sy, vx: view.x, vy: view.y, moved: false, region };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const [sx, sy] = svgPoint(e.clientX, e.clientY);
    setCursor(inLens(sx, sy) ? (projectionFor(viewRef.current).invert!([sx, sy]) as [number, number]) : null);
    if (!d) return;
    if (!d.moved && Math.hypot(sx - d.sx, sy - d.sy) < 4) return;
    if (!d.moved) setDragging(true);
    d.moved = true;
    setHover(null);
    setView((v) => clampView({ k: v.k, x: d.vx - (sx - d.sx) / v.k, y: d.vy - (sy - d.sy) / v.k }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d || d.moved) return;
    // Taps only act on Mindanao: a region selects and frames it; tapping inside
    // the selected region zooms in there (shift zooms out). Water does nothing.
    const target = d.region;
    if (!target) return;
    if (target !== scope && !e.shiftKey) {
      lastScope.current = target;
      setScope(target);
      flyTo(REGION_VIEW[target], 700);
      return;
    }
    const [bx, by] = toBase(view, d.sx, d.sy);
    flyTo({ x: bx, y: by, k: e.shiftKey ? view.k / 2 : view.k * 2 });
  };

  const zoomBy = (f: number) => flyTo({ ...view, k: view.k * f }, 320);
  const reset = () => {
    lastScope.current = "all";
    setScope("all");
    flyTo(HOME, 650);
  };

  const projection = useMemo(() => projectionFor(view), [view]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const atHome = view.k < 1.02 && Math.abs(view.x - HOME.x) < 1 && Math.abs(view.y - HOME.y) < 1;

  const geo = useMemo(() => {
    const step = view.k >= 4 ? 0.5 : 1;
    const [fx0, fy0] = projection([FIELD_BOUNDS.west, FIELD_BOUNDS.north])!;
    const [fx1, fy1] = projection([FIELD_BOUNDS.east, FIELD_BOUNDS.south])!;
    return {
      step,
      graticule: path(geoGraticule().step([step, step]).extent([[116, 2], [130, 13]])()) ?? "",
      ctx: CTX.features.map((f) => path(f) ?? ""),
      provs: MIND.features.map((f) => ({
        name: (f.properties as { name: string }).name,
        region: regionOf(f),
        d: path(f) ?? "",
        c: path.centroid(f),
        a: path.area(f),
      })),
      regionC: Object.fromEntries(REGIONS.map((r) => [r.id, path.centroid(REGION_FC[r.id])])) as Record<RegionId, [number, number]>,
      field: { x: fx0, y: fy0, w: fx1 - fx0, h: fy1 - fy0 },
    };
  }, [path, projection, view.k]);

  // where the selected species is landed, by region (this quarter)
  const shareBy = useMemo(() => {
    const vals = REGIONS.map((r) => YIELDS[r.id][selected.id][index].value);
    const max = Math.max(...vals);
    return Object.fromEntries(REGIONS.map((r, i) => [r.id, { v: vals[i], t: vals[i] / max }])) as Record<RegionId, { v: number; t: number }>;
  }, [selected.id, index]);
  const topRegion = REGIONS.reduce((a, r) => (shareBy[r.id].v > shareBy[a.id].v ? r : a), REGIONS[0]).id;


  const scaleBar = useMemo(() => {
    const [, lat] = projection.invert!([CX, CY])!;
    const pxPerKm = (S0 * view.k) / (6371 * Math.cos((lat * Math.PI) / 180));
    const km = NICE_KM.reduce((b, n) => (Math.abs(n * pxPerKm - 70) < Math.abs(b * pxPerKm - 70) ? n : b), NICE_KM[0]);
    return { km, px: km * pxPerKm };
  }, [projection, view.k]);

  const rScale = useMemo(() => scaleSqrt().domain([0, scopeMax[scope]]).range([0, 46]), [scope]);
  const placed = useMemo(() => {
    const n = visible.length;
    return visible.map((s, i) => {
      const a = -Math.PI * 0.78 + (i * 2 * Math.PI) / n;
      const r = Math.max(7, rScale(YIELDS[scope][s.id][index].value));
      return { s, a, r, x: CX + RING * Math.cos(a), y: CY + RING * Math.sin(a) };
    });
  }, [visible, index, scope, rScale]);

  const sel = placed.find((p) => p.s.id === selected.id);
  const leaderRegion: RegionId = scope === "all" ? topRegion : scope;
  const halo = { paintOrder: "stroke" as const, stroke: "rgba(10,17,40,0.75)", strokeWidth: 3, strokeLinejoin: "round" as const };
  const labelMode = view.k >= 2.6 ? "province" : "region";

  const hoverInfo = hover && {
    ...hover,
    name: REGIONS.find((r) => r.id === hover.region)!.name,
    mix: catchMix(hover.region, index),
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full touch-none select-none"
        role="img"
        aria-label="Map of Mindanao waters with species landings"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setCursor(null)}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <defs>
          <clipPath id="lens">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
            <stop offset="74%" stopColor="#0a1128" stopOpacity="0" />
            <stop offset="100%" stopColor="#0a1128" stopOpacity="0.55" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <circle cx={CX} cy={CY} r={R + 6} fill="#1282a2" opacity={0.22} filter="url(#glow)" />

        <g clipPath="url(#lens)" className={dragging ? "cursor-grabbing" : "cursor-crosshair"}>
          <rect x={CX - R} y={CY - R} width={R * 2} height={R * 2} fill="var(--deep-navy)" />
          <image ref={imgRef} x={geo.field.x} y={geo.field.y} width={geo.field.w} height={geo.field.h} preserveAspectRatio="none" />
          <path d={geo.graticule} fill="none" stroke="#fefcfb" strokeOpacity={0.12} strokeWidth={0.6} />
          {geo.ctx.map((d, i) => (
            <path key={i} d={d} fill="var(--land)" stroke="var(--land-edge)" strokeWidth={0.4} opacity={0.6} />
          ))}
          {geo.provs.map((p) => {
            const dim = scope !== "all" && p.region !== scope;
            const tint = shareBy[p.region].t;
            return (
              <g key={p.name} data-region={p.region} className="cursor-pointer" opacity={dim ? 0.45 : 1}>
                <path
                  d={p.d}
                  fill={hover?.region === p.region ? "var(--land-hover)" : "var(--land)"}
                  stroke="var(--land-edge)"
                  strokeWidth={0.5}
                  onMouseMove={(e) => {
                    if (drag.current?.moved) return;
                    const b = wrapRef.current!.getBoundingClientRect();
                    setHover({ region: p.region, x: e.clientX - b.left, y: e.clientY - b.top });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
                <path d={p.d} fill="#5cc0dc" fillOpacity={0.06 + 0.5 * tint * tint} pointerEvents="none" />
              </g>
            );
          })}
          {/* outline the selected region */}
          {scope !== "all" && (
            <path d={path(REGION_FC[scope]) ?? ""} fill="none" stroke="var(--white)" strokeWidth={1.4} pointerEvents="none" />
          )}

          {labelMode === "region" &&
            REGIONS.map((r) => {
              const [x, y] = geo.regionC[r.id];
              const active = scope === r.id;
              return (
                <text key={r.id} x={x} y={y} textAnchor="middle" fontSize={view.k >= 1.6 ? 11.5 : 10.5} fontWeight={600} fill={active ? "var(--white)" : "rgba(254,252,251,0.72)"} pointerEvents="none" style={{ ...halo, stroke: "rgba(22,36,74,0.9)" }}>
                  {view.k >= 1.6 ? r.name : r.short}
                </text>
              );
            })}
          {labelMode === "province" &&
            geo.provs
              .filter((p) => p.a > 2200 && inLens(p.c[0], p.c[1]) && !p.name.includes("Not a Province") && p.name !== "Special Geographic Area")
              .map((p) => (
                <text key={p.name} x={p.c[0]} y={p.c[1]} textAnchor="middle" fontSize={10.5} fill="rgba(254,252,251,0.75)" pointerEvents="none" style={{ ...halo, stroke: "rgba(22,36,74,0.9)" }}>
                  {p.name}
                </text>
              ))}

          {GROUNDS.filter((g) => view.k >= 1.8 || ["sulu", "celebes", "bohol"].includes(g.id)).map((g) => {
            const [x, y] = projection([g.lon, g.lat])!;
            return (
              <text
                key={g.id}
                x={x}
                y={y}
                textAnchor={g.anchor ?? "middle"}
                fontSize={10.5}
                fontStyle="italic"
                letterSpacing="0.02em"
                fill="rgba(254,252,251,0.55)"
                pointerEvents="none"
                style={halo}
              >
                {g.name}
              </text>
            );
          })}

          <rect x={CX - R} y={CY - R} width={R * 2} height={R * 2} fill="url(#vignette)" pointerEvents="none" />

          <g transform={`translate(${CX - scaleBar.px / 2}, ${CY + R - 30})`} pointerEvents="none">
            <path d={`M0,0 v4 h${scaleBar.px} v-4`} fill="none" stroke="var(--white)" strokeWidth={1.2} style={halo} />
            <text x={scaleBar.px / 2} y={-4} textAnchor="middle" fontSize={10} fill="var(--white)" style={halo}>
              {scaleBar.km} km
            </text>
          </g>
        </g>

        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(92,192,220,0.55)" strokeWidth={1} pointerEvents="none" />

        {sel &&
          (() => {
            const [gx, gy] = geo.regionC[leaderRegion];
            let ex = gx, ey = gy;
            const dx = gx - CX, dy = gy - CY;
            const dist = Math.hypot(dx, dy);
            if (dist > R) {
              ex = CX + (dx / dist) * R;
              ey = CY + (dy / dist) * R;
            }
            return (
              <g pointerEvents="none">
                <path d={`M${sel.x - Math.cos(sel.a) * sel.r},${sel.y - Math.sin(sel.a) * sel.r} L${ex},${ey}`} stroke="rgba(254,252,251,0.7)" strokeWidth={1} fill="none" strokeDasharray="2 4" />
                {dist <= R && <circle cx={ex} cy={ey} r={3} fill="var(--white)" />}
              </g>
            );
          })()}

        {placed.map(({ s, a, r, x, y }) => {
          const c = corr[s.id][layer];
          const active = s.id === selected.id;
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          const lx = x + cos * (r + 10);
          const ly = y + sin * (r + 10);
          const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
          const baseY = sin < -0.35 ? ly - (active || hoverBubble === s.id ? 14 : 2) : sin > 0.35 ? ly + 12 : ly + 4;
          const value = YIELDS[scope][s.id][index].value;
          return (
            <g
              key={s.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(s.id)}
              onMouseEnter={() => setHoverBubble(s.id)}
              onMouseLeave={() => setHoverBubble(null)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(s.id)}
              aria-label={`${s.local}, ${Math.round(value)} tonnes`}
            >
              {active && <circle cx={x} cy={y} r={r + 5} fill="none" stroke="var(--white)" strokeWidth={1.25} />}
              <circle cx={x} cy={y} r={r} fill={corrColor(c)} stroke="var(--paper)" strokeWidth={1.5} style={{ transition: "r 380ms cubic-bezier(.2,.7,.2,1)" }} />
              <text x={lx} y={baseY} textAnchor={anchor} fontSize={12.5} fontWeight={active ? 600 : 400} fill={active ? "var(--ink)" : "var(--ink-2)"}>
                {s.local}
              </text>
              {(active || hoverBubble === s.id) && (
                <text x={lx} y={baseY + 15} textAnchor={anchor} fontSize={11} fill="var(--ink-3)">
                  {Math.round(value).toLocaleString()} t
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoverInfo && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-line-strong bg-glass-strong px-2.5 py-1.5 text-[12px] shadow-xl backdrop-blur"
          style={{ left: hoverInfo.x + 14, top: hoverInfo.y + 14 }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-ink">{hoverInfo.name}</span>
            <span className="text-ink-3">{Math.round(hoverInfo.mix.reduce((a, m) => a + m.v, 0)).toLocaleString()} t</span>
          </div>
          <ul className="mt-1.5 w-[210px] space-y-1">
            {hoverInfo.mix.slice(0, 5).map((m) => (
              <li key={m.s.id} className="grid items-center gap-2" style={{ gridTemplateColumns: "86px 1fr 34px" }}>
                <span className={m.s.id === selected.id ? "font-medium text-ink" : "text-ink-2"}>{m.s.local}</span>
                <span className="h-1 overflow-hidden rounded-full bg-hi">
                  <span className="block h-full rounded-full bg-[#5cc0dc]" style={{ width: `${(m.share / hoverInfo.mix[0].share * 100).toFixed(1)}%` }} />
                </span>
                <span className="text-right text-ink-3">{(m.share * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-1.5 text-[11px] text-ink-3">+{hoverInfo.mix.length - 5} more species · click to open</div>
        </div>
      )}

      <div className="absolute right-3 top-3 flex items-center gap-3">
        {cursor && <span className="mono text-[11px] text-ink-3">{`${cursor[1].toFixed(2)}°N  ${cursor[0].toFixed(2)}°E`}</span>}
        <div className="glass flex overflow-hidden rounded-full text-ink-2">
          <button onClick={() => zoomBy(0.5)} aria-label="Zoom out" disabled={view.k <= K_MIN} className="grid h-8 w-8 place-items-center hover:bg-hi hover:text-ink disabled:opacity-30">
            <svg width="11" height="11" viewBox="0 0 11 11"><path d="M0 5.5h11" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <button onClick={() => zoomBy(2)} aria-label="Zoom in" disabled={view.k >= K_MAX} className="grid h-8 w-8 place-items-center border-x border-line hover:bg-hi hover:text-ink disabled:opacity-30">
            <svg width="11" height="11" viewBox="0 0 11 11"><path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <button onClick={reset} aria-label="Reset view" disabled={atHome && scope === "all"} className="grid h-8 w-8 place-items-center hover:bg-hi hover:text-ink disabled:opacity-30">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 6.5a4.5 4.5 0 1 0 1.3-3.2M2 1.5v2.5h2.5" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
