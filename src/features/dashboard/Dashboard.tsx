"use client";

// Page layout. State comes from useDashboardState; this file only places the
// five areas: header, map, left panel, right panel, timeline.
// Desktop (lg+) pins everything to the viewport; below that the areas stack.
// The panel slide/hide rules are in globals.css under "collapsible side panels".
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { BubbleLegend } from "@/features/map/Legends";
import { OceanLens } from "@/features/map/OceanLens";
import { Timeline } from "@/features/timeline/Timeline";
import { CORRELATION } from "@/lib/data";
import { Header } from "./Header";
import { InsightsPanel } from "./InsightsPanel";
import { OceanReadout } from "./OceanReadout";
import { SpeciesPanel } from "./SpeciesPanel";
import { useDashboardState } from "./useDashboardState";
import { usePanels } from "./usePanels";

// Only downloaded when the user first opens the history view.
const HistoryModal = dynamic(() => import("@/features/history/HistoryModal"), { ssr: false });

const PANEL = "glass scroll-thin relative z-10 mx-3 mt-3 overflow-y-auto rounded-2xl lg:absolute lg:bottom-[92px] lg:top-[56px] lg:m-0";

export function Dashboard() {
  const s = useDashboardState();
  const [historyOpen, setHistoryOpen] = useState(false);
  const openHistory = useCallback(() => setHistoryOpen(true), []);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const panels = usePanels(!historyOpen);

  return (
    <div
      className="atmosphere relative flex min-h-screen flex-col lg:h-screen lg:overflow-hidden"
      data-left={panels.leftOpen ? "open" : "closed"}
      data-right={panels.rightOpen ? "open" : "closed"}
    >
      <Header scope={s.scope} onScope={s.setScope} leftOpen={panels.leftOpen} rightOpen={panels.rightOpen} onToggleLeft={panels.toggleLeft} onToggleRight={panels.toggleRight} />

      <main className="stage-map relative order-1 w-full lg:absolute lg:bottom-[92px] lg:top-[56px] lg:w-auto">
        <div className="pointer-events-none relative z-10 px-4 pt-3 lg:absolute lg:left-3 lg:top-3 lg:p-0 [&_button]:pointer-events-auto">
          <OceanReadout layer={s.layer} setLayer={s.setLayer} scope={s.scope} index={s.index} />
        </div>
        <div className="relative aspect-[9/8.6] w-full lg:absolute lg:inset-0 lg:aspect-auto">
          <OceanLens layer={s.layer} index={s.index} scope={s.scope} setScope={s.setScope} visible={s.visible} selected={s.selected} onSelect={s.select} corr={CORRELATION[s.scope]} />
        </div>
        <div className="absolute bottom-3 right-3 z-10 hidden md:block">
          <BubbleLegend layer={s.layer} />
        </div>
      </main>

      <aside inert={!panels.leftOpen} className={`side-left order-2 lg:left-3 lg:w-[328px] ${PANEL}`}>
        <InsightsPanel scope={s.scope} index={s.index} layer={s.layer} selected={s.selected} onSelect={s.select} onOpenHistory={openHistory} />
      </aside>

      <aside inert={!panels.rightOpen} className={`side-right order-3 lg:right-3 lg:w-[288px] ${PANEL}`}>
        <SpeciesPanel scope={s.scope} selected={s.selected} mode={s.mode} setMode={s.setMode} checked={s.checked} toggle={s.toggle} onSelect={s.select} />
      </aside>

      <footer className="glass sticky bottom-0 z-30 order-4 mx-3 my-3 rounded-2xl lg:absolute lg:inset-x-3 lg:bottom-3 lg:m-0">
        <Timeline index={s.index} setIndex={s.setIndex} playing={s.playing} setPlaying={s.setPlaying} layer={s.layer} scope={s.scope} />
      </footer>

      {historyOpen && <HistoryModal initialSpeciesId={s.selectedId} initialScope={s.scope} onClose={closeHistory} onSpeciesChange={s.select} />}
    </div>
  );
}
