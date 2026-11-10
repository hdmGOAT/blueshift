"use client";

// The map: a circular lens over Mindanao, ringed by species bubbles.
// This file only wires pieces together:
//   geometry.ts     projection, static shapes, view maths
//   useMapView.ts   zoom / pan / tap handling
//   MapLayers.tsx   raster, grid, land (inside the zoom transform)
//   MapLabels.tsx   names and scale bar (outside it)
//   SpeciesRing.tsx bubbles and leader line
import { useEffect, useMemo, useRef, useState } from "react";
import { REGIONS, YIELDS, type Corr, type Layer, type RegionId, type Scope, type Species } from "@/lib/data";
import { CX, CY, H, HOME, K_MAX, K_MIN, R, REGION_CENTROID, REGION_VIEW, W, isHome, toScreen, viewTransform } from "./geometry";
import { FieldLayer, Graticule, LandLayer } from "./MapLayers";
import { MapLabels, ScaleBar } from "./MapLabels";
import { RegionTooltip } from "./RegionTooltip";
import { ringLayout } from "./ring";
import { Leader, SpeciesRing } from "./SpeciesRing";
import { useMapView, type FlyTo, type MapHover, type MapTap } from "./useMapView";
import { ZoomControls } from "./ZoomControls";

type Props = {
  layer: Layer;
  /** Quarter index being shown. */
  index: number;
  scope: Scope;
  setScope: (s: Scope) => void;
  /** Species shown as bubbles. */
  visible: Species[];
  selected: Species;
  onSelect: (id: string) => void;
  /** Correlation per species id for the current scope. */
  corr: Record<string, Corr>;
};

const FINE_GRID_AT = 4;

export function OceanLens({ layer, index, scope, setScope, visible, selected, onSelect, corr }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const [hoverRegion, setHoverRegion] = useState<RegionId | null>(null);

  // Mouse movement updates the tooltip position and coordinate readout
  // straight on the DOM; React only re-renders when the hovered region changes.
  const onHover = (h: MapHover | null) => {
    setHoverRegion(h?.region ?? null);
    if (coordRef.current) coordRef.current.textContent = h ? `${h.lonLat[1].toFixed(2)}°N  ${h.lonLat[0].toFixed(2)}°E` : "";
    if (h?.region && tipRef.current && wrapRef.current) {
      const box = wrapRef.current.getBoundingClientRect();
      tipRef.current.style.transform = `translate(${h.clientX - box.left + 14}px, ${h.clientY - box.top + 14}px)`;
    }
  };

  // Taps only act on land: a region selects it (the effect below frames it);
  // tapping inside the selected region zooms in there, shift-tap zooms out.
  const onTap = ({ region, bx, by, k, shiftKey }: MapTap, fly: FlyTo) => {
    if (!region) return;
    if (region !== scope && !shiftKey) setScope(region);
    else fly({ x: bx, y: by, k: k * (shiftKey ? 0.5 : 2) });
  };

  const { svgRef, view, dragging, flyTo, zoomBy, handlers } = useMapView({ onTap, onHover });

  // Frame the region whenever the scope changes, wherever it was changed from.
  useEffect(() => {
    flyTo(scope === "all" ? HOME : REGION_VIEW[scope], 700);
  }, [scope, flyTo]);

  // Where the selected species is landed this quarter, 0..1 per region.
  const tint = useMemo(() => {
    const vals = REGIONS.map((r) => YIELDS[r.id][selected.id][index].value);
    const max = Math.max(...vals);
    return Object.fromEntries(REGIONS.map((r, i) => [r.id, vals[i] / max])) as Record<RegionId, number>;
  }, [selected.id, index]);

  const bubbles = useMemo(() => ringLayout(visible, scope, index), [visible, scope, index]);
  const selectedBubble = bubbles.find((b) => b.species.id === selected.id);
  // The leader points at the chosen region, or the species' biggest region.
  const leaderRegion = scope === "all" ? REGIONS.reduce((a, r) => (tint[r.id] > tint[a.id] ? r : a)).id : scope;

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-full w-full touch-none select-none" role="img" aria-label="Map of Mindanao waters with species landings" {...handlers}>
        <defs>
          <clipPath id="lens">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
            <stop offset="74%" style={{ stopColor: "var(--prussian-blue)", stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: "var(--prussian-blue)", stopOpacity: 0.55 }} />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <circle cx={CX} cy={CY} r={R + 6} fill="var(--cerulean)" opacity={0.22} filter="url(#glow)" />

        <g clipPath="url(#lens)" className={dragging ? "cursor-grabbing" : "cursor-crosshair"}>
          <rect x={CX - R} y={CY - R} width={R * 2} height={R * 2} fill="var(--deep-navy)" />
          <g transform={viewTransform(view)}>
            <FieldLayer layer={layer} index={index} />
            <Graticule fine={view.k >= FINE_GRID_AT} />
            <LandLayer scope={scope} hoverRegion={hoverRegion} tint={tint} />
          </g>
          <MapLabels view={view} scope={scope} />
          <rect x={CX - R} y={CY - R} width={R * 2} height={R * 2} fill="url(#vignette)" pointerEvents="none" />
          <ScaleBar view={view} />
        </g>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--accent-text)" strokeOpacity={0.55} pointerEvents="none" />

        {selectedBubble && <Leader from={selectedBubble} to={toScreen(view, ...REGION_CENTROID[leaderRegion])} />}
        <SpeciesRing bubbles={bubbles} selectedId={selected.id} layer={layer} corr={corr} onSelect={onSelect} />
      </svg>

      <div ref={tipRef} className="pointer-events-none absolute left-0 top-0 z-20" hidden={!hoverRegion}>
        {hoverRegion && <RegionTooltip region={hoverRegion} index={index} selectedId={selected.id} />}
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-3">
        <span ref={coordRef} className="mono text-[11px] text-ink-3" />
        <ZoomControls
          canZoomIn={view.k < K_MAX}
          canZoomOut={view.k > K_MIN}
          canReset={scope !== "all" || !isHome(view)}
          onZoomIn={() => zoomBy(2)}
          onZoomOut={() => zoomBy(0.5)}
          onReset={() => {
            setScope("all");
            flyTo(HOME, 650);
          }}
        />
      </div>
    </div>
  );
}
