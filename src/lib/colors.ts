// Colour scales for DATA (correlation, anomalies). UI colours live as CSS
// variables in src/app/globals.css; use those in components, not hex codes.
import { scaleLinear } from "d3-scale";
import type { Layer, OceanPoint } from "./data";

// Diverging: negative correlation (catch falls as the variable rises) = coral,
// positive = cerulean, near zero = muted slate. Tuned to read on prussian blue.
const corrScale = scaleLinear<string>()
  .domain([-0.9, -0.45, -0.15, 0, 0.15, 0.45, 0.9])
  .range(["#e0563b", "#ef8a6a", "#b79a90", "#6b7a97", "#7fb5c9", "#2fa3c4", "#1282a2"])
  .clamp(true);

/** Colour for a correlation score in [-1, 1]. */
export const corrColor = (r: number) => corrScale(r);

/** CSS gradient spanning the correlation scale, for legends and meters. */
export const CORR_GRADIENT = `linear-gradient(90deg, ${corrColor(-0.9)}, ${corrColor(0)} 50%, ${corrColor(0.9)})`;

const anomalyScale = scaleLinear<string>()
  .domain([-0.3, -0.1, 0, 0.1, 0.3])
  .range(["#1282a2", "#3f6f95", "#1d2b4c", "#a5574a", "#e0563b"])
  .clamp(true);

/**
 * Colour of one quarter in an anomaly strip: coral = stressful (warm water or
 * low chlorophyll), cerulean = favourable. Chlorophyll anomalies are ~10x
 * smaller and inverted, so they are rescaled onto the same range.
 */
export function stripeColor(layer: Layer, o: Pick<OceanPoint, "sstAnom" | "chlAnom">) {
  return layer === "sst" ? anomalyScale(o.sstAnom - 0.05) : anomalyScale(-(o.chlAnom + 0.03) * 9);
}
