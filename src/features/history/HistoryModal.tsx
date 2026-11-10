"use client";

// Full history for one species: step through species, switch region and
// quarterly/annual, inspect the chart and tables, export CSV.
// Loaded on demand (see Dashboard.tsx), so it is not in the first page load.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/Segmented";
import { FishCreditLine } from "@/features/fish/FishCreditLine";
import { REGIONS, SPECIES, SPECIES_BY_ID, type Scope } from "@/lib/data";
import { fmt } from "@/lib/format";
import { downloadCsv } from "./csv";
import { HistoryChart } from "./HistoryChart";
import { HistoryReadout } from "./HistoryReadout";
import { PeriodTable } from "./PeriodTable";
import { RegionTable } from "./RegionTable";
import { buildRows, scopeRegions, type Grain } from "./rows";
import { ScopeTabs } from "./ScopeTabs";
import { SpeciesStepper, speciesAt } from "./SpeciesStepper";

type Props = {
  initialSpeciesId: string;
  initialScope: Scope;
  onClose: () => void;
  /** Called when the user steps to another species, so the dashboard can follow. */
  onSpeciesChange?: (id: string) => void;
};

export default function HistoryModal({ initialSpeciesId, initialScope, onClose, onSpeciesChange }: Props) {
  const [speciesId, setSpeciesId] = useState(initialSpeciesId);
  const [scope, setScope] = useState<Scope>(initialScope);
  const [grain, setGrain] = useState<Grain>("q");
  /** Index of the row under the cursor, shared by the chart and the table. */
  const [hover, setHover] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const species = SPECIES_BY_ID[speciesId];
  const rows = useMemo(() => buildRows(species, scope, grain), [species, scope, grain]);
  const regions = useMemo(() => scopeRegions(scope), [scope]);

  const pick = useCallback(
    (id: string) => {
      setSpeciesId(id);
      setHover(null);
      onSpeciesChange?.(id);
    },
    [onSpeciesChange],
  );
  const step = useCallback((dir: 1 | -1) => pick(speciesAt(SPECIES.indexOf(species) + dir).id), [pick, species]);

  // Esc closes; left/right arrows step through species. Page scroll is locked while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.target as HTMLElement).closest("select, input")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const hovered = hover !== null ? rows[hover] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Species history">
      <div className="absolute inset-0 bg-prussian/70 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-rise relative flex max-h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-line-strong bg-modal shadow-2xl">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-5 py-4">
          <SpeciesStepper species={species} onStep={step} onPick={pick} />
          <div className="ml-auto flex items-center gap-2">
            <Segmented value={grain} onChange={setGrain} size="sm" options={[["q", "Quarterly"], ["y", "Annual"]]} />
            <button onClick={() => downloadCsv(species, scope, grain, rows)} className="rounded-full border border-line-strong px-3 py-1 text-[12px] font-medium text-ink-2 hover:bg-hi hover:text-ink">
              Export CSV
            </button>
            <button ref={closeRef} onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-hi hover:text-ink">
              <CloseIcon />
            </button>
          </div>
        </div>

        <ScopeTabs scope={scope} onScope={setScope} />

        <div className="scroll-thin grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 px-5 py-4">
            <HistoryReadout row={hovered} scope={scope} grain={grain} />
            <HistoryChart species={species} scope={scope} grain={grain} rows={rows} regions={regions} hover={hover} onHover={setHover} />
            {scope === "all" && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-3">
                {REGIONS.map((r) => (
                  <span key={r.id} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />
                    {r.name}
                    {hovered && <span className="text-ink-2">{fmt(hovered.byRegion[r.id])}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <aside className="border-t border-line px-4 py-4 lg:border-l lg:border-t-0">
            <RegionTable species={species} scope={scope} onScope={setScope} />
            <PeriodTable rows={rows} grain={grain} hover={hover} onHover={setHover} />
            <FishCreditLine id={species.id} className="mt-4" />
          </aside>
        </div>
      </div>
    </div>
  );
}
