"use client";

// The global filter row under the header. Shows the filters the current view
// uses (see views.ts); every filter reads and writes the shared dashboard state.
import { Segmented } from "@/components/ui/Segmented";
import type { DashboardState } from "@/features/dashboard/useDashboardState";
import { VIEW_BY_ID } from "@/features/dashboard/views";
import { AreaSelect } from "./AreaSelect";
import { Field } from "./Field";
import { SpeciesMulti } from "./SpeciesMulti";
import { SpeciesSelect } from "./SpeciesSelect";
import { YearRange } from "./YearRange";

export function FilterBar({ s }: { s: DashboardState }) {
  const f = VIEW_BY_ID[s.view].filters;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 px-4 py-2.5">
      {f.includes("area") && <AreaSelect area={s.view === "overview" ? s.scope : s.area} onArea={s.setArea} regionsOnly={s.view === "overview"} />}
      {f.includes("years") && <YearRange years={s.years} onYears={s.setYears} />}
      {f.includes("resolution") && (
        <Field label="Resolution">
          <Segmented size="sm" value={s.resolution} onChange={s.setResolution} options={[["quarterly", "Quarterly"], ["annual", "Annual"]]} />
        </Field>
      )}
      {f.includes("species") && <SpeciesSelect value={s.selectedId} onChange={s.select} />}
      {f.includes("speciesMulti") && <SpeciesMulti value={s.tracked} onChange={s.setTracked} />}
      {f.includes("variable") && (
        <Field label="Variable">
          <Segmented size="sm" value={s.layer} onChange={s.setLayer} options={[["sst", "SST"], ["chl", "Chlorophyll-a"]]} />
        </Field>
      )}
      {s.view === "overview" && <span className="text-[12px] text-ink-3">Use the timeline to move through quarters; open a tab above to filter by province and years.</span>}
    </div>
  );
}
