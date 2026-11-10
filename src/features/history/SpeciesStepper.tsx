"use client";

import { ChevronIcon } from "@/components/ui/icons";
import { DitheredFish } from "@/features/fish/DitheredFish";
import { SPECIES, type Species } from "@/lib/data";

function StepButton({ dir, onClick, label }: { dir: 1 | -1; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={`${dir < 0 ? "Previous" : "Next"} species: ${label}`}
      title={`${label} (${dir < 0 ? "←" : "→"})`}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-2 hover:bg-hi hover:text-ink"
    >
      <ChevronIcon dir={dir < 0 ? "left" : "right"} />
    </button>
  );
}

/** Wraps around the species list: -1 from the first gives the last. */
export const speciesAt = (i: number) => SPECIES[(i + SPECIES.length) % SPECIES.length];

type Props = { species: Species; onStep: (dir: 1 | -1) => void; onPick: (id: string) => void };

/** Modal header: previous/next arrows, the fish, and the name (which doubles as a picker). */
export function SpeciesStepper({ species, onStep, onPick }: Props) {
  const pos = SPECIES.indexOf(species);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <StepButton dir={-1} onClick={() => onStep(-1)} label={speciesAt(pos - 1).local} />
      <DitheredFish key={species.id} id={species.id} width={128} className="animate-rise mx-1 hidden shrink-0 sm:block" />
      <div className="min-w-0">
        {/* The <select> is stretched invisibly over the name, so clicking the name opens it. */}
        <label className="group relative flex cursor-pointer items-center gap-2">
          <h2 className="font-display text-[26px] font-medium leading-tight group-hover:text-accent-text">{species.local}</h2>
          <span className="mt-1 text-ink-3 group-hover:text-accent-text">
            <ChevronIcon dir="down" />
          </span>
          <span className="mono mt-1 text-[11px] text-ink-3">
            {pos + 1} / {SPECIES.length}
          </span>
          <select value={species.id} onChange={(e) => onPick(e.target.value)} aria-label="Choose species" className="absolute inset-0 cursor-pointer opacity-0">
            {SPECIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.local} · {s.english}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[12.5px] text-ink-3">
          {species.english} · <i>{species.scientific}</i> · {species.habitat}
        </p>
      </div>
      <StepButton dir={1} onClick={() => onStep(1)} label={speciesAt(pos + 1).local} />
    </div>
  );
}
