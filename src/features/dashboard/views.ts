// The five pages, the filters each one uses, and the request each one makes.
// The filter bar, the Download button and the views all read from here, so the
// downloaded CSV always matches the page.
import { toQuery } from "@/lib/analysis";
import type { DashboardState } from "./useDashboardState";

export type ViewId = "overview" | "ocean" | "fisheries" | "explorer" | "regional";
export type FilterId = "area" | "years" | "resolution" | "species" | "speciesMulti" | "variable";

export type ViewDef = {
  id: ViewId;
  label: string;
  blurb: string;
  filters: FilterId[];
  /** The /api dataset behind the page (also its CSV export). */
  dataset: "analysis" | "ocean" | "fisheries" | "regional";
};

export const VIEWS: ViewDef[] = [
  { id: "overview", label: "Overview", blurb: "Platform-wide environmental and fisheries highlights", filters: ["area"], dataset: "fisheries" },
  { id: "ocean", label: "Ocean Monitor", blurb: "Satellite environmental observations", filters: ["area", "years", "resolution", "variable"], dataset: "ocean" },
  { id: "fisheries", label: "Fisheries Tracker", blurb: "Species and provincial production", filters: ["area", "years", "resolution", "speciesMulti"], dataset: "fisheries" },
  { id: "explorer", label: "Relationship Explorer", blurb: "Statistical relationships and correlations", filters: ["area", "years", "resolution", "species", "variable"], dataset: "analysis" },
  { id: "regional", label: "Regional Insights", blurb: "Geographic comparisons and patterns", filters: ["years", "variable", "speciesMulti"], dataset: "regional" },
];

export const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v])) as Record<ViewId, ViewDef>;

type Q = Record<string, string | number | boolean | string[]>;

/** Query string for a view's API request, from the shared state. */
export function viewQuery(view: ViewId, s: Pick<DashboardState, "area" | "years" | "resolution" | "layer" | "selectedId" | "tracked" | "lag" | "deseason" | "detrend">): string {
  const [from, to] = s.years;
  const base: Q = { area: s.area, from, to, resolution: s.resolution };
  const q: Record<ViewId, Q> = {
    overview: { area: s.area, species: [s.selectedId], resolution: "quarterly", from: 2016, to: 2026 },
    ocean: { ...base, variable: s.layer },
    fisheries: { ...base, species: s.tracked },
    explorer: { ...base, species: s.selectedId, variable: s.layer, lag: s.lag, deseason: s.deseason, detrend: s.detrend },
    regional: { from, to, variable: s.layer, species: s.tracked },
  };
  return toQuery(q[view]);
}
