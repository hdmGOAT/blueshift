"use client";

// The layers that live INSIDE the zoom/pan transform. They are drawn in base
// space (see geometry.ts) and memoised, so zooming and dragging do not
// re-render them. Strokes use non-scaling-stroke to stay hairline at any zoom.
import { memo, useMemo } from "react";
import { REGIONS, type Layer, type RegionId, type Scope } from "@/lib/data";
import { renderField } from "@/lib/field";
import { CONTEXT_PATH, FIELD_RECT, GRATICULE, REGION_PATH } from "./geometry";

/** Sea temperature / chlorophyll raster for one quarter. */
export const FieldLayer = memo(function FieldLayer({ layer, index }: { layer: Layer; index: number }) {
  const href = useMemo(() => renderField(layer, index), [layer, index]);
  return <image href={href} {...FIELD_RECT} preserveAspectRatio="none" />;
});

/** Lat/lon grid. Switches to 0.5° once zoomed in. */
export const Graticule = memo(function Graticule({ fine }: { fine: boolean }) {
  return <path d={fine ? GRATICULE.fine : GRATICULE.coarse} fill="none" stroke="var(--white)" strokeOpacity={0.12} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />;
});

type LandProps = {
  scope: Scope;
  hoverRegion: RegionId | null;
  /** 0..1 per region: how much of the selected species is landed there. */
  tint: Record<RegionId, number>;
};

/**
 * Neighbouring islands plus the six Mindanao regions. Each region is a
 * `data-region` group; useMapView reads that attribute for hover and taps.
 */
export const LandLayer = memo(function LandLayer({ scope, hoverRegion, tint }: LandProps) {
  return (
    <>
      <path d={CONTEXT_PATH} fill="var(--land)" stroke="var(--land-edge)" strokeWidth={0.4} opacity={0.6} vectorEffect="non-scaling-stroke" />
      {REGIONS.map((r) => (
        <g key={r.id} data-region={r.id} className="cursor-pointer" opacity={scope !== "all" && scope !== r.id ? 0.45 : 1}>
          <path d={REGION_PATH[r.id]} fill={hoverRegion === r.id ? "var(--land-hover)" : "var(--land)"} stroke="var(--land-edge)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          <path d={REGION_PATH[r.id]} fill="var(--accent-text)" fillOpacity={0.06 + 0.5 * tint[r.id] ** 2} pointerEvents="none" />
        </g>
      ))}
      {scope !== "all" && <path d={REGION_PATH[scope]} fill="none" stroke="var(--white)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" pointerEvents="none" />}
    </>
  );
});
