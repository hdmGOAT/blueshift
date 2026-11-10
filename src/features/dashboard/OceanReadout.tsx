"use client";

import { Segmented } from "@/components/ui/Segmented";
import { FieldLegend } from "@/features/map/Legends";
import { OCEAN, oceanMean, regionName, type Layer, type Scope } from "@/lib/data";

/** Quarters that make up the "normal" baseline (2016 to 2020). */
const BASELINE = [0, 20] as const;

type Props = { layer: Layer; setLayer: (l: Layer) => void; scope: Scope; index: number };

/** Top-left of the map: layer switch, the current average, and the colour legend. */
export function OceanReadout({ layer, setLayer, scope, index }: Props) {
  const point = OCEAN[scope][index];
  const sst = layer === "sst";
  const delta = (sst ? point.sstAnom : point.chlAnom) - oceanMean(scope, sst ? "sstAnom" : "chlAnom", ...BASELINE);
  // Warmer water and lower chlorophyll are the worrying directions.
  const worrying = sst ? delta > 0 : delta < 0;
  return (
    <div className="space-y-2.5">
      <Segmented value={layer} onChange={setLayer} options={[["sst", "Sea temp"], ["chl", "Chlorophyll-a"]]} />
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[30px] font-medium leading-none">{sst ? point.sst.toFixed(2) : point.chl.toFixed(3)}</span>
          <span className="text-[13px] text-ink-2">{sst ? "°C" : "mg/m³"}</span>
        </div>
        <div className="mt-1 text-[11.5px] text-ink-3">
          <span style={{ color: worrying ? "var(--warm)" : "var(--accent-text)" }}>
            {delta >= 0 ? "+" : "−"}
            {Math.abs(delta).toFixed(sst ? 2 : 3)}
          </span>{" "}
          vs 2016–20 · {regionName(scope)}
        </div>
      </div>
      <FieldLegend layer={layer} />
    </div>
  );
}
