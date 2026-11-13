// Known data-quality issues, shown wherever they affect the current selection
// (filters, explorer caveats, Methodology). Facts about the data file only:
// causes are described as likely, not certain.
import { areaProvinces } from "./provinces";
import type { AreaId } from "./types";

export type DataNote = { id: string; provinces: string[]; from: number; to: number; text: string };

export const DATA_NOTES: DataNote[] = [
  {
    id: "zds-2022",
    provinces: ["zamboanga-del-sur"],
    from: 2022,
    to: 2024,
    text: "Zamboanga del Sur's recorded landings are about 7× higher in 2022–2024 than in the years either side (Bali sardinella about 35×). This looks like a change in what was reported rather than in the catch, and it dominates Region IX and Mindanao totals for those years. Consider excluding 2022–2024 or the province.",
  },
  {
    id: "davocc-2019",
    provinces: ["davao-occidental"],
    from: 2003,
    to: 2018,
    text: "Davao Occidental has no recorded landings before 2019, so Davao Region totals step up in 2019.",
  },
];

/** Notes that apply to an area over a year range. */
export function notesFor(area: AreaId, from: number, to: number) {
  const ids = new Set(areaProvinces(area).map((p) => p.id));
  return DATA_NOTES.filter((n) => n.provinces.some((p) => ids.has(p)) && n.from <= to && n.to >= from);
}
