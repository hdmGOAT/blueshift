// Names, units and number formats for the two ocean variables.
import type { Layer } from "./data";

export const VARIABLE: Record<Layer, { name: string; long: string; unit: string; digits: number; color: string }> = {
  sst: { name: "SST", long: "Sea surface temperature", unit: "°C", digits: 2, color: "var(--warm)" },
  chl: { name: "Chlorophyll-a", long: "Chlorophyll-a concentration", unit: "mg/m³", digits: 3, color: "var(--chl)" },
};

/** 29.1234 -> "29.12 °C" */
export const fmtVar = (layer: Layer, n: number, withUnit = true) => `${n.toFixed(VARIABLE[layer].digits)}${withUnit ? ` ${VARIABLE[layer].unit}` : ""}`;
