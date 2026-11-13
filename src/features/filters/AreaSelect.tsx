"use client";

import { AREA_GROUPS, type AreaId } from "@/lib/data";
import { Field, SELECT } from "./Field";

/** Geographic filter: all Mindanao, a region, or a province (grouped by region). */
export function AreaSelect({ area, onArea, regionsOnly }: { area: AreaId; onArea: (a: AreaId) => void; regionsOnly?: boolean }) {
  return (
    <Field label="Area" htmlFor="f-area">
      <select id="f-area" value={area} onChange={(e) => onArea(e.target.value)} className={`${SELECT} max-w-[220px]`}>
        <option value="all">All Mindanao</option>
        {regionsOnly
          ? AREA_GROUPS.map(({ region }) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))
          : AREA_GROUPS.map(({ region, provinces }) => (
              <optgroup key={region.id} label={region.name}>
                <option value={region.id}>{region.name} (region)</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
      </select>
    </Field>
  );
}
