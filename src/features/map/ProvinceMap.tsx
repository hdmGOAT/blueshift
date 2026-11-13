"use client";

// A flat map of Mindanao's provinces, each filled by a value (choropleth).
// Optionally shows the ocean raster for one quarter around the coast.
// Click a province to pick it; hover names it and gives its value.
import { memo, useState, type ReactNode } from "react";
import type { Layer } from "@/lib/data";
import { FieldLayer } from "./MapLayers";
import { CONTEXT_PATH, LAND_VIEWBOX, OTHER_LAND_PATH, PROVINCE_SHAPES } from "./geometry";

type Props = {
  /** Value per province id; null = no data (drawn as plain land). */
  values: Record<string, number | null>;
  color: (v: number) => string;
  format: (v: number) => string;
  /** Province ids drawn with a white outline. */
  selected?: string[];
  /** Province ids marked with a warm ring (e.g. areas of concern). */
  flagged?: string[];
  onPick?: (id: string) => void;
  raster?: { layer: Layer; index: number };
  ariaLabel: string;
  legend?: ReactNode;
};

export const ProvinceMap = memo(function ProvinceMap({ values, color, format, selected = [], flagged = [], onPick, raster, ariaLabel, legend }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const hovered = PROVINCE_SHAPES.find((p) => p.id === hover);

  return (
    <div className="relative">
      <svg viewBox={LAND_VIEWBOX} className="block h-auto w-full" role="img" aria-label={ariaLabel} onPointerLeave={() => setHover(null)}>
        <rect x={-2000} y={-2000} width={6000} height={6000} fill="var(--deep-navy)" />
        {raster && <FieldLayer layer={raster.layer} index={raster.index} />}
        <path d={CONTEXT_PATH} fill="var(--land)" stroke="var(--land-edge)" strokeWidth={0.4} opacity={0.6} />
        <path d={OTHER_LAND_PATH} fill="var(--land)" stroke="var(--land-edge)" strokeWidth={0.5} />
        {PROVINCE_SHAPES.map((p) => {
          const v = values[p.id];
          return (
            <path
              key={p.id}
              d={p.d}
              fill={v === null || v === undefined ? "var(--land)" : color(v)}
              stroke={hover === p.id ? "var(--white)" : "var(--paper)"}
              strokeWidth={hover === p.id ? 1.4 : 0.6}
              className={onPick ? "cursor-pointer" : undefined}
              onPointerEnter={() => setHover(p.id)}
              onClick={() => onPick?.(p.id)}
              role={onPick ? "button" : undefined}
              tabIndex={onPick ? 0 : undefined}
              aria-label={`${p.name}${v === null || v === undefined ? "" : `, ${format(v)}`}`}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick?.(p.id)}
            />
          );
        })}
        {PROVINCE_SHAPES.filter((p) => flagged.includes(p.id)).map((p) => (
          <circle key={`f-${p.id}`} cx={p.centroid[0]} cy={p.centroid[1]} r={5} fill="none" stroke="var(--warm)" strokeWidth={2} pointerEvents="none" />
        ))}
        {PROVINCE_SHAPES.filter((p) => selected.includes(p.id)).map((p) => (
          <path key={`s-${p.id}`} d={p.d} fill="none" stroke="var(--white)" strokeWidth={2} pointerEvents="none" />
        ))}
      </svg>
      {hovered && (
        <div className="pointer-events-none absolute left-2 top-2 rounded-lg border border-line-strong bg-glass-strong px-2.5 py-1.5 text-[12px] shadow-xl backdrop-blur">
          <div className="font-medium text-ink">{hovered.name}</div>
          <div className="text-ink-2">{values[hovered.id] === null || values[hovered.id] === undefined ? "No data" : format(values[hovered.id]!)}</div>
        </div>
      )}
      {legend && <div className="absolute bottom-2 left-2">{legend}</div>}
    </div>
  );
});
