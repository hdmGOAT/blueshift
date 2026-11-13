// Ocean Monitor summary for one area and variable over a year range.
// Served by /api/ocean.
import { BASELINE, PROVINCES, areaName, quartersIn, areaOcean, type Layer } from "@/lib/data";
import type { OceanParams } from "./params";
import { envSeries, periods, perYear, seasonallyAdjusted } from "./series";
import { mean } from "./stats";
import { fittedChange, type Change } from "./trend";

export type OceanSummary = {
  params: OceanParams;
  areaName: string;
  unit: string;
  /** One row per period. `anomaly` is the departure from the BASELINE mean for that quarter (or year). */
  series: { label: string; value: number; anomaly: number }[];
  stats: { mean: number; min: number; max: number; minLabel: string; maxLabel: string; n: number };
  baseline: number;
  /** The years `baseline` averages over. */
  baselineYears: { from: number; to: number };
  /** Seasonally adjusted trend over the range. */
  change: Change;
  /** Annual mean anomaly per year in range, for comparing years. */
  years: { year: number; anomaly: number; partial: boolean }[];
  /** Mean over the range for every province, for the map. */
  provinces: { id: string; value: number }[];
};

export const UNIT: Record<Layer, string> = { sst: "°C", chl: "mg/m³" };

export function oceanSummary(params: OceanParams): OceanSummary {
  const { area, variable, resolution, from, to } = params;
  const per = periods(resolution, from, to);
  const values = envSeries(area, variable, per);
  const ocean = areaOcean(area);

  // Baseline per quarter-of-year, so quarterly anomalies are not seasonal.
  const baseQ = quartersIn(BASELINE.from, BASELINE.to);
  const qNormal = [1, 2, 3, 4].map((q) => mean(baseQ.filter((i) => i % 4 === q - 1).map((i) => ocean[i][variable])));
  const baseline = mean(qNormal);
  const series = per.map((p, i) => ({
    label: p.label,
    value: values[i],
    anomaly: values[i] - mean(p.quarters.map((qi) => qNormal[qi % 4])),
  }));

  let minI = 0, maxI = 0;
  values.forEach((v, i) => {
    if (v < values[minI]) minI = i;
    if (v > values[maxI]) maxI = i;
  });

  const years = [];
  for (let y = from; y <= to; y++) {
    const qs = quartersIn(y, y);
    if (!qs.length) continue;
    years.push({ year: y, anomaly: mean(qs.map((i) => ocean[i][variable] - qNormal[i % 4])), partial: qs.length < 4 });
  }

  const rangeQ = quartersIn(from, to);
  return {
    params,
    areaName: areaName(area),
    unit: UNIT[variable],
    series,
    stats: { mean: mean(values), min: values[minI], max: values[maxI], minLabel: per[minI].label, maxLabel: per[maxI].label, n: values.length },
    baseline,
    baselineYears: BASELINE,
    change: fittedChange(seasonallyAdjusted(values, per), perYear(resolution)),
    years,
    provinces: PROVINCES.map((p) => ({ id: p.id, value: mean(rangeQ.map((i) => areaOcean(p.id)[i][variable])) })),
  };
}
