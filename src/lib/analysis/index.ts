// The analysis layer: statistics, summaries and CSV builders that run inside
// the /api routes (src/app/api). UI code imports TYPES from here, plus the few
// small helpers re-exported below; it fetches results from the API.
export * from "./params";
export type { AnalysisResult, Stats, Pair, LagRow } from "./relationship";
export type { Interpretation } from "./interpret";
export { fmtP } from "./interpret";
export type { OceanSummary } from "./ocean";
export type { FisheriesSummary, Place } from "./fisheries";
export type { RegionalSummary, AreaRow } from "./regional";
export { ENV_ALERT, DECLINE_PCT, SHARP_DECLINE_PCT } from "./regional";
export type { Change } from "./trend";
export type { Highlight, HighlightsResult } from "./highlights";
