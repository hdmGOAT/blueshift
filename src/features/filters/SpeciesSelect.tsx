"use client";

import { SPECIES } from "@/lib/data";
import { Field, SELECT } from "./Field";

/** Single-species filter. */
export function SpeciesSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <Field label="Species" htmlFor="f-species">
      <select id="f-species" value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
        {SPECIES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.local} · {s.english}
          </option>
        ))}
      </select>
    </Field>
  );
}
