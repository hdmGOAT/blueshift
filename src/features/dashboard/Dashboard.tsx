"use client";

// Page shell: header with navigation, the global filter bar, and the active
// view. State comes from useDashboardState; views.ts says which filters and
// API request each view uses. The Overview fills the screen on desktop; the
// other views scroll.
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { FilterBar } from "@/features/filters/FilterBar";
import { RelationshipExplorer } from "@/features/explorer/RelationshipExplorer";
import { FisheriesTracker } from "@/features/fisheries/FisheriesTracker";
import { OceanMonitor } from "@/features/ocean/OceanMonitor";
import { OverviewView } from "@/features/overview/OverviewView";
import { RegionalInsights } from "@/features/regional/RegionalInsights";
import { Header } from "./Header";
import { useDashboardState } from "./useDashboardState";
import { usePanels } from "./usePanels";
import { VIEW_BY_ID, viewQuery } from "./views";

// Only downloaded when first opened.
const HistoryModal = dynamic(() => import("@/features/history/HistoryModal"), { ssr: false });
const MethodologyModal = dynamic(() => import("@/features/methodology/MethodologyModal"), { ssr: false });

export function Dashboard() {
  const s = useDashboardState();
  const [modal, setModal] = useState<"history" | "methodology" | null>(null);
  const openHistory = useCallback(() => setModal("history"), []);
  const openMethodology = useCallback(() => setModal("methodology"), []);
  const closeModal = useCallback(() => setModal(null), []);
  const overview = s.view === "overview";
  const panels = usePanels(overview && !modal);

  const query = viewQuery(s.view, s);
  const downloadHref = `/api/export?dataset=${VIEW_BY_ID[s.view].dataset}&${query}`;

  return (
    <div className={`atmosphere relative flex min-h-screen flex-col ${overview ? "lg:h-screen lg:overflow-hidden" : ""}`}>
      <div className="relative z-30">
        <Header view={s.view} onView={s.setView} downloadHref={downloadHref} onMethodology={openMethodology} panels={panels} />
        <FilterBar s={s} />
      </div>

      {overview ? (
        <OverviewView s={s} leftOpen={panels.leftOpen} rightOpen={panels.rightOpen} onOpenHistory={openHistory} />
      ) : (
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 pb-8 pt-2 sm:px-4">
          {s.view === "ocean" && <OceanMonitor query={query} area={s.area} setArea={s.setArea} layer={s.layer} years={s.years} />}
          {s.view === "fisheries" && <FisheriesTracker query={query} setArea={s.setArea} tracked={s.tracked} setTracked={s.setTracked} />}
          {s.view === "explorer" && (
            <RelationshipExplorer
              query={query}
              resolution={s.resolution}
              lag={s.lag}
              setLag={s.setLag}
              deseason={s.deseason}
              setDeseason={s.setDeseason}
              detrend={s.detrend}
              setDetrend={s.setDetrend}
            />
          )}
          {s.view === "regional" && <RegionalInsights query={query} layer={s.layer} years={s.years} tracked={s.tracked} />}
        </main>
      )}

      {modal === "history" && <HistoryModal initialSpeciesId={s.selectedId} initialScope={s.scope} onClose={closeModal} onSpeciesChange={s.select} />}
      {modal === "methodology" && <MethodologyModal onClose={closeModal} />}
    </div>
  );
}
