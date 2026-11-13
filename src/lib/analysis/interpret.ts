// Plain-language reading of an analysis: direction, strength, significance,
// what the slope means, and the limitations that apply. Pure.
import { strengthLabel } from "@/lib/data";
import type { AnalysisParams } from "./params";
import type { LagRow, Stats } from "./relationship";

export type Interpretation = {
  /** One-line verdict, e.g. "Moderate negative relationship, statistically significant". */
  headline: string;
  /** Short paragraphs explaining the result. */
  points: string[];
  /** Limitations a reader must keep in mind. */
  caveats: string[];
  /** For styling: "significant" | "marginal" | "none" | "insufficient". */
  level: "significant" | "marginal" | "none" | "insufficient";
};

type Input = {
  params: AnalysisParams;
  areaName: string;
  speciesName: string;
  applied: { deseason: boolean; detrend: boolean };
  requestedDeseason: boolean;
  landlocked: boolean;
  stats: Stats | null;
  lagProfile: LagRow[];
};

const VAR_LONG = { sst: "sea surface temperature", chl: "chlorophyll-a" } as const;
const STEP = { sst: { size: 0.1, text: "+0.1 °C" }, chl: { size: 0.01, text: "+0.01 mg/m³" } } as const;

export function fmtP(p: number) {
  if (p < 0.001) return "p < 0.001";
  return `p = ${p < 0.01 ? p.toFixed(3) : p.toFixed(2)}`;
}

function significance(p: number) {
  if (p < 0.01) return { level: "significant" as const, text: "highly statistically significant" };
  if (p < 0.05) return { level: "significant" as const, text: "statistically significant" };
  if (p < 0.1) return { level: "marginal" as const, text: "only marginally significant" };
  return { level: "none" as const, text: "not statistically significant" };
}

const unitName = (p: AnalysisParams, n: number) => (p.resolution === "quarterly" ? (n === 1 ? "quarter" : "quarters") : n === 1 ? "year" : "years");

export function interpret(a: Input): Interpretation {
  const { params: p, stats } = a;
  const v = VAR_LONG[p.variable];
  const caveats: string[] = [];

  if (a.requestedDeseason && !a.applied.deseason && p.resolution === "quarterly")
    caveats.push("Seasonal adjustment needs at least two years of data, so it was not applied. Shared seasonal cycles can inflate the correlation.");
  if (p.resolution === "quarterly" && !a.applied.deseason && !a.requestedDeseason)
    caveats.push("Seasonal adjustment is off: both series have seasonal cycles, which can create a correlation that is about the time of year rather than ocean conditions.");
  if (!a.applied.detrend) caveats.push("Long-term trends are not removed. Two series that both drift over the decade can correlate without being linked.");
  if (a.landlocked) caveats.push(`${a.areaName} has no coastline; its ocean values are its region's coastal waters, and its landings are mostly freshwater and pond production.`);
  caveats.push("Correlation is not causation: landings also depend on fishing effort, fleet size, regulations, prices and reporting.");
  caveats.push("Consecutive periods are not independent, so p-values here are likely optimistic.");

  if (!stats) {
    return {
      headline: "Not enough data for a reliable result",
      points: [`Only ${a.lagProfile.find((l) => l.lag === p.lag)?.n ?? 0} paired ${unitName(p, 2)} are available. Widen the year range or switch to quarterly resolution.`],
      caveats,
      level: "insufficient",
    };
  }

  const r = stats.pearson;
  const sig = significance(stats.pPearson);
  const strength = strengthLabel(r);
  const headline = Math.abs(r) < 0.2 ? `No clear relationship (${fmtP(stats.pPearson)})` : `${strength} relationship, ${sig.text} (${fmtP(stats.pPearson)})`;

  const lagText = p.lag === 0 ? "in the same period" : `${p.lag} ${unitName(p, p.lag)} earlier`;
  const points: string[] = [];

  if (Math.abs(r) >= 0.2) {
    const higher = a.applied.deseason ? "higher than usual for the season" : "higher";
    const dir = r < 0 ? "lower" : "higher";
    points.push(`When ${v} around ${a.areaName.replace(/^All /, "")} was ${higher} ${lagText}, ${a.speciesName} landings tended to be ${dir}.`);
    const step = STEP[p.variable];
    const effect = stats.slope * step.size;
    points.push(
      a.applied.deseason
        ? `On the fitted line, every ${step.text} is associated with landings ${Math.abs(effect).toFixed(1)} percentage points ${effect < 0 ? "below" : "above"} their seasonal norm. The variable explains about ${(stats.r2 * 100).toFixed(0)}% of the variation (R²).`
        : `On the fitted line, every ${step.text} is associated with ${Math.abs(effect).toLocaleString(undefined, { maximumFractionDigits: 0 })} t ${effect < 0 ? "less" : "more"} landed per ${unitName(p, 1)}. The variable explains about ${(stats.r2 * 100).toFixed(0)}% of the variation (R²).`,
    );
  } else {
    points.push(`Over these ${stats.n} ${unitName(p, stats.n)}, ${a.speciesName} landings in ${a.areaName} do not move consistently with ${v} ${lagText}.`);
  }

  const gap = Math.abs(stats.pearson - stats.spearman);
  points.push(
    gap < 0.15
      ? `Pearson (${stats.pearson.toFixed(2)}) and Spearman (${stats.spearman.toFixed(2)}) agree, so the result is not driven by a few extreme values.`
      : `Pearson (${stats.pearson.toFixed(2)}) and Spearman (${stats.spearman.toFixed(2)}) differ, which suggests outliers or a non-linear pattern. Check the scatterplot.`,
  );

  const best = a.lagProfile.filter((l) => l.n >= 5).reduce((b, l) => (Math.abs(l.r) > Math.abs(b.r) ? l : b), a.lagProfile[0]);
  if (best && best.lag !== p.lag && Math.abs(best.r) - Math.abs(r) > 0.1)
    points.push(`The link is stronger with a ${best.lag}-${unitName(p, 1)} lag (r = ${best.r.toFixed(2)}). Testing many lags raises the chance of a false positive.`);

  if (stats.n < 12) caveats.unshift(`Small sample: ${stats.n} pairs. Treat this result as exploratory.`);

  return { headline, points, caveats, level: Math.abs(r) < 0.2 ? "none" : sig.level };
}
