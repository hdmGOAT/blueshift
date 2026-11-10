"use client";

import { useEffect, useMemo, useState } from "react";
import { CORRELATION, LAST_OBSERVED, OCEAN, QUARTERS, REGIONS, SPECIES, regionName, topSpecies, type Layer, type Scope } from "@/lib/data";
import { OceanLens } from "./OceanLens";
import { Timeline } from "./Timeline";
import { HistoryModal } from "./HistoryModal";
import { DitheredFish } from "./DitheredFish";
import {
  Block,
  BubbleLegend,
  CatchMix,
  CorrelationCard,
  ExpandIcon,
  FieldLegend,
  KeyFinding,
  Segmented,
  Outlook,
  SpeciesFilter,
  TrendChart,
} from "./Panels";


export function Dashboard() {
  const [layer, setLayer] = useState<Layer>("sst");
  const [index, setIndex] = useState(LAST_OBSERVED);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState("galunggong");
  const [scope, setScope] = useState<Scope>("all");
  const [mode, setMode] = useState<"top" | "all">("top");
  const [checked, setChecked] = useState<Set<string>>(() => new Set(topSpecies("all")));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // [ and ] toggle the side panels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (historyOpen || t.closest("input, select, textarea")) return;
      if (e.key === "[") setLeftOpen((v) => !v);
      if (e.key === "]") setRightOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % QUARTERS.length), 550);
    return () => clearInterval(t);
  }, [playing]);

  const visible = useMemo(() => SPECIES.filter((s) => checked.has(s.id)), [checked]);
  const selected = SPECIES.find((s) => s.id === selectedId)!;

  const select = (id: string) => {
    setSelectedId(id);
    if (!checked.has(id)) setChecked(new Set([...checked, id]));
  };
  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (next.size) setChecked(next);
  };
  const changeMode = (m: "top" | "all") => {
    setMode(m);
    setChecked(new Set(m === "top" ? topSpecies(scope) : SPECIES.map((s) => s.id)));
  };
  // each region has its own species mix, so "Top 10" follows the region
  const changeScope = (s: Scope) => {
    setScope(s);
    if (mode === "top") setChecked(new Set([...topSpecies(s), selectedId]));
  };

  const oc = OCEAN[scope];
  const baseSst = oc.slice(0, 20).reduce((a, o) => a + o.sstAnom, 0) / 20;
  const baseChl = oc.slice(0, 20).reduce((a, o) => a + o.chlAnom, 0) / 20;
  const o = oc[index];
  const now =
    layer === "sst"
      ? { value: o.sst.toFixed(2), unit: "°C", delta: o.sstAnom - baseSst, d: 2, bad: o.sstAnom - baseSst > 0 }
      : { value: o.chl.toFixed(3), unit: "mg/m³", delta: o.chlAnom - baseChl, d: 3, bad: o.chlAnom - baseChl < 0 };

  return (
    <div
      className="atmosphere relative flex min-h-screen flex-col lg:h-screen lg:overflow-hidden"
      data-left={leftOpen ? "open" : "closed"}
      data-right={rightOpen ? "open" : "closed"}
    >
      {/* top bar */}
      <header className="relative z-20 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pt-3 lg:absolute lg:inset-x-0 lg:top-0">
        <PanelToggle side="left" open={leftOpen} onClick={() => setLeftOpen(!leftOpen)} />
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <circle cx="11" cy="11" r="10" fill="none" stroke="#5cc0dc" strokeWidth="1.5" />
            <path d="M3 12.5c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 2.9-1.5 2.9-1.5" fill="none" stroke="#fefcfb" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="font-display text-[19px] font-semibold tracking-[-0.02em]">BlueShift</span>
        </div>

        <div className="glass flex items-center gap-1 rounded-full py-0.5 pl-3 pr-1 text-[12.5px]">
          <span className="text-ink-3">Mindanao</span>
          <span className="text-ink-3">/</span>
          <select
            value={scope}
            onChange={(e) => changeScope(e.target.value as Scope)}
            className="cursor-pointer rounded-full bg-transparent py-1 pl-1 pr-1 font-medium text-ink outline-none"
            aria-label="Region"
          >
            <option value="all">All regions</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-3 text-[11.5px] text-ink-3">
          <span className="label hidden md:inline">Sources · NASA OB.DAAC · PSA</span>
          <span className="label rounded-full bg-hi px-2.5 py-1 !text-ink-2">Sample data</span>
          <PanelToggle side="right" open={rightOpen} onClick={() => setRightOpen(!rightOpen)} />
        </div>
      </header>

      {/* map */}
      <main className="relative order-1 w-full stage-map lg:absolute lg:w-auto lg:inset-y-[56px] lg:aspect-auto lg:bottom-[92px]">
        <div className="pointer-events-none relative z-10 space-y-2.5 px-4 pt-3 lg:absolute lg:left-3 lg:top-3 lg:p-0 [&_button]:pointer-events-auto [&_select]:pointer-events-auto">
          <Segmented value={layer} onChange={setLayer} options={[["sst", "Sea temp"], ["chl", "Chlorophyll-a"]]} />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[30px] font-medium leading-none tracking-[-0.02em]">{now.value}</span>
              <span className="text-[13px] text-ink-2">{now.unit}</span>
            </div>
            <div className="mt-1 text-[11.5px] text-ink-3">
              <span style={{ color: now.bad ? "var(--warm)" : "var(--accent-text)" }}>
                {now.delta >= 0 ? "+" : "−"}
                {Math.abs(now.delta).toFixed(now.d)}
              </span>{" "}
              vs 2016–20 · {regionName(scope)}
            </div>
          </div>
          <FieldLegend layer={layer} />
        </div>

        <div className="relative aspect-[9/8.6] w-full lg:absolute lg:inset-0 lg:aspect-auto">
        <OceanLens layer={layer} index={index} scope={scope} setScope={changeScope} visible={visible} selected={selected} onSelect={select} corr={CORRELATION[scope]} />
        </div>

        <div className="absolute bottom-3 right-3 z-10 hidden md:block">
          <BubbleLegend layer={layer} />
        </div>
      </main>

      {/* left panel */}
      <aside inert={!leftOpen} className="side-left glass scroll-thin relative z-10 order-2 mx-3 mt-3 overflow-y-auto rounded-2xl lg:absolute lg:bottom-[92px] lg:left-3 lg:top-[56px] lg:m-0 lg:w-[328px]">
        <KeyFinding scope={scope} onSelect={select} />
        <Block
          title="Selected species"
          action={
            <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-1.5 text-[12px] text-accent-text hover:text-ink">
              History <ExpandIcon />
            </button>
          }
        >
          <div className="mb-3 flex items-center gap-3">
            <DitheredFish id={selected.id} width={112} className="shrink-0" />
            <div className="min-w-0">
              <div className="text-[16px] font-medium leading-tight">{selected.local}</div>
              <div className="truncate text-[12px] text-ink-3">{selected.english}</div>
              <div className="truncate text-[11.5px] italic text-ink-3">{selected.scientific}</div>
            </div>
          </div>
          <div className="label mb-1">Landings, t</div>
          <TrendChart species={selected} scope={scope} index={index} layer={layer} />
          <Outlook species={selected} scope={scope} index={index} />
        </Block>
        <Block title={`Catch mix · ${regionName(scope)}`}>
          <CatchMix scope={scope} index={index} selectedId={selectedId} onSelect={select} />
        </Block>
      </aside>

      {/* right panel */}
      <aside inert={!rightOpen} className="side-right glass scroll-thin relative z-10 order-3 mx-3 mt-3 overflow-y-auto rounded-2xl lg:absolute lg:bottom-[92px] lg:right-3 lg:top-[56px] lg:m-0 lg:w-[288px]">
        <Block title="Species">
          <SpeciesFilter mode={mode} setMode={changeMode} checked={checked} toggle={toggle} selectedId={selectedId} onSelect={select} />
        </Block>
        <Block title={`Correlation · ${selected.local}`}>
          <CorrelationCard species={selected} scope={scope} />
        </Block>
      </aside>

      {/* timeline dock */}
      <footer className="glass sticky bottom-0 z-30 order-4 mx-3 my-3 rounded-2xl lg:absolute lg:inset-x-3 lg:bottom-3 lg:m-0">
        <Timeline index={index} setIndex={setIndex} playing={playing} setPlaying={setPlaying} layer={layer} scope={scope} />
      </footer>

      {historyOpen && <HistoryModal initialSpeciesId={selectedId} initialScope={scope} onClose={() => setHistoryOpen(false)} onSpeciesChange={select} />}
    </div>
  );
}

function PanelToggle({ side, open, onClick }: { side: "left" | "right"; open: boolean; onClick: () => void }) {
  const label = `${open ? "Hide" : "Show"} ${side === "left" ? "insights" : "species"} panel (${side === "left" ? "[" : "]"})`;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={open}
      title={label}
      className={`hidden h-8 w-8 place-items-center rounded-full transition-colors lg:grid ${open ? "text-ink-2 hover:bg-hi hover:text-ink" : "bg-hi text-ink"}`}
    >
      <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="0.65" y="0.65" width="14.7" height="12.7" rx="2.5" />
        <path d={side === "left" ? "M5.5 1v12" : "M10.5 1v12"} />
        {open && <rect x={side === "left" ? 1.5 : 11} y="1.5" width="3.5" height="11" rx="1" fill="currentColor" stroke="none" opacity="0.5" />}
      </svg>
    </button>
  );
}
