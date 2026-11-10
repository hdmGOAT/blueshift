import { scaleLinear } from "d3-scale";

// Diverging: negative correlation (catch falls as the variable rises) = coral,
// positive = cerulean, near zero = muted slate. Tuned to read on prussian blue.
const corrScale = scaleLinear<string>()
  .domain([-0.9, -0.45, -0.15, 0, 0.15, 0.45, 0.9])
  .range(["#e0563b", "#ef8a6a", "#b79a90", "#6b7a97", "#7fb5c9", "#2fa3c4", "#1282a2"])
  .clamp(true);

export const corrColor = (r: number) => corrScale(r);

export const anomalyColor = scaleLinear<string>()
  .domain([-0.3, -0.1, 0, 0.1, 0.3])
  .range(["#1282a2", "#3f6f95", "#1d2b4c", "#a5574a", "#e0563b"])
  .clamp(true);
