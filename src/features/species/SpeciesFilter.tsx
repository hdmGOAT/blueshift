"use client";

import { memo } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { SPECIES } from "@/lib/data";

export type FilterMode = "top" | "all";

type Props = {
  mode: FilterMode;
  setMode: (m: FilterMode) => void;
  /** Ids of species shown on the map. */
  checked: Set<string>;
  toggle: (id: string) => void;
  selectedId: string;
  onSelect: (id: string) => void;
};

/** Checklist of species: the checkbox shows/hides a bubble, the name selects it. */
export const SpeciesFilter = memo(function SpeciesFilter({ mode, setMode, checked, toggle, selectedId, onSelect }: Props) {
  return (
    <div>
      <Segmented value={mode} onChange={setMode} size="sm" options={[["top", "Top 10"], ["all", `All ${SPECIES.length}`]]} />
      <ul className="-mx-2 mt-3">
        {SPECIES.map((s) => {
          const on = checked.has(s.id);
          const active = s.id === selectedId;
          return (
            <li key={s.id} className={`flex items-center gap-2.5 rounded-lg px-2 py-[5px] transition-colors ${active ? "bg-hi" : "hover:bg-hi/60"}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="h-3.5 w-3.5" aria-label={`Show ${s.local} on the map`} />
              <button onClick={() => onSelect(s.id)} className="flex min-w-0 flex-1 items-baseline justify-between gap-2 text-left">
                <span className={`truncate text-[13px] ${on ? "text-ink" : "text-ink-3"} ${active ? "font-medium" : ""}`}>{s.local}</span>
                <span className="truncate text-[11.5px] text-ink-3">{s.english}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
