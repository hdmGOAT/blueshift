"use client";

// Multi-species filter: a button that opens a checklist. Empty = all species.
import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/icons";
import { SPECIES, SPECIES_BY_ID } from "@/lib/data";
import { Field } from "./Field";

export function SpeciesMulti({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  const text = value.length === 0 ? "All species" : value.length === 1 ? SPECIES_BY_ID[value[0]].local : `${value.length} species`;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <Field label="Species">
      <div ref={ref} className="relative">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox" className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1 text-[12.5px] font-medium hover:bg-hi">
          {text} <ChevronIcon dir="down" />
        </button>
        {open && (
          <div className="animate-rise absolute left-0 top-full z-40 mt-2 w-[260px] rounded-xl border border-line-strong bg-glass-strong p-2 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between px-1 pb-1.5">
              <span className="label">Pick any number</span>
              <button onClick={() => onChange([])} className="text-[12px] text-accent-text hover:text-ink">
                All species
              </button>
            </div>
            <ul className="scroll-thin max-h-[320px] overflow-y-auto" role="listbox" aria-multiselectable>
              {SPECIES.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-baseline gap-2 rounded-lg px-1.5 py-1 text-[12.5px] hover:bg-hi">
                    <input type="checkbox" checked={value.includes(s.id)} onChange={() => toggle(s.id)} className="h-3.5 w-3.5 translate-y-0.5" />
                    <span className="text-ink">{s.local}</span>
                    <span className="truncate text-[11.5px] text-ink-3">{s.english}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Field>
  );
}
