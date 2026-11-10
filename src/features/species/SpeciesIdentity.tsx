import { DitheredFish } from "@/features/fish/DitheredFish";
import type { Species } from "@/lib/data";

/** Fish image with the local, English and scientific names. */
export function SpeciesIdentity({ species }: { species: Species }) {
  return (
    <div className="flex items-center gap-3">
      <DitheredFish id={species.id} width={112} className="shrink-0" />
      <div className="min-w-0">
        <div className="text-[16px] font-medium leading-tight">{species.local}</div>
        <div className="truncate text-[12px] text-ink-3">{species.english}</div>
        <div className="truncate text-[11.5px] italic text-ink-3">{species.scientific}</div>
      </div>
    </div>
  );
}
