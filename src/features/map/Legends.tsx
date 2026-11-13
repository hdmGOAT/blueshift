import { memo } from "react";
import { CORR_GRADIENT } from "@/lib/colors";
import type { Layer } from "@/lib/data";
import { CHL_DOMAIN, CHL_GRADIENT, SST_DOMAIN, SST_GRADIENT } from "@/lib/field";

/** Colour ramp for the ocean layer. */
export const FieldLegend = memo(function FieldLegend({ layer }: { layer: Layer }) {
  const stops = layer === "sst" ? SST_GRADIENT : CHL_GRADIENT;
  const ticks =
    layer === "sst"
      ? [`${SST_DOMAIN[0]}°`, `${((SST_DOMAIN[0] + SST_DOMAIN[1]) / 2).toFixed(1)}°`, `${SST_DOMAIN[1]}°`]
      : [`${CHL_DOMAIN[0]}`, Math.sqrt(CHL_DOMAIN[0] * CHL_DOMAIN[1]).toFixed(2), `${CHL_DOMAIN[1]} mg/m³`];
  return (
    <div className="w-[180px]">
      <div className="h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${stops.join(",")})` }} />
      <div className="mt-1 flex justify-between text-[10.5px] text-ink-3">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
});

/** Explains bubble size (landings) and colour (correlation). */
export const BubbleLegend = memo(function BubbleLegend({ layer }: { layer: Layer }) {
  return (
    <div className="flex items-end gap-5 text-[11px] text-ink-3">
      <div className="flex items-end gap-1.5">
        {[5, 9, 14].map((r) => (
          <span key={r} className="rounded-full border border-ink-3" style={{ width: r * 2, height: r * 2 }} />
        ))}
        <span className="ml-1">Landings</span>
      </div>
      <div>
        <div className="mb-1">r · {layer === "sst" ? "sea temp" : "chl-a"}</div>
        <div className="flex items-center gap-1.5">
          <span>−1</span>
          <span className="h-1.5 w-24 rounded-full" style={{ background: CORR_GRADIENT }} />
          <span>+1</span>
        </div>
      </div>
    </div>
  );
});
