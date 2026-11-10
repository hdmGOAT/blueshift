// CSV export for the history modal.
import type { Scope, Species } from "@/lib/data";
import { scopeRegions, type Grain, type Row } from "./rows";

export function toCsv(scope: Scope, rows: Row[]) {
  const regions = scopeRegions(scope);
  const head = ["period", "landings_t", ...regions.map((r) => `${r.id}_t`), "sst_c", "chl_mg_m3", "projected"];
  const body = rows.map((r) => [r.label, r.total.toFixed(0), ...regions.map((g) => r.byRegion[g.id].toFixed(0)), r.sst.toFixed(2), r.chl.toFixed(3), r.projected ? "1" : "0"]);
  return [head, ...body].map((line) => line.join(",")).join("\n");
}

/** Triggers a browser download of the rows currently shown. */
export function downloadCsv(species: Species, scope: Scope, grain: Grain, rows: Row[]) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([toCsv(scope, rows)], { type: "text/csv" }));
  a.download = `blueshift_${species.id}_${scope}_${grain === "q" ? "quarterly" : "annual"}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
