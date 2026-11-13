"use client";

// Top bar: brand, the five-page navigation, and the global actions
// (methodology, download, panel toggles on the Overview).
import { memo } from "react";
import { BrandMark, PanelIcon } from "@/components/ui/icons";
import { VIEWS, type ViewId } from "./views";

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
      <PanelIcon side={side} open={open} />
    </button>
  );
}

type Props = {
  view: ViewId;
  onView: (v: ViewId) => void;
  /** URL of the CSV for the current view and filters. */
  downloadHref: string;
  onMethodology: () => void;
  panels: { leftOpen: boolean; rightOpen: boolean; toggleLeft: () => void; toggleRight: () => void };
};

const ACTION = "rounded-full border border-line-strong px-3 py-1 text-[12px] font-medium text-ink-2 hover:bg-hi hover:text-ink";

export const Header = memo(function Header({ view, onView, downloadHref, onMethodology, panels }: Props) {
  const overview = view === "overview";
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pt-3">
      {overview && <PanelToggle side="left" open={panels.leftOpen} onClick={panels.toggleLeft} />}
      <div className="flex items-center gap-2.5">
        <BrandMark />
        <div className="leading-tight">
          <div className="font-display text-[19px] font-semibold">BlueShift</div>
          <div className="hidden text-[11px] text-ink-3 xl:block">Be an Earth system trend detective</div>
        </div>
      </div>

      <nav aria-label="Sections" className="scroll-thin -mx-1 flex max-w-full overflow-x-auto px-1">
        <div className="glass flex rounded-full p-0.5 text-[12.5px]">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => onView(v.id)}
              aria-current={view === v.id ? "page" : undefined}
              title={v.blurb}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition-colors ${view === v.id ? "bg-white text-prussian" : "text-ink-2 hover:text-ink"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <span className="label hidden 2xl:inline">Sources · NASA OB.DAAC · PSA</span>
        <span className="label rounded-full bg-hi px-2.5 py-1 !text-ink-2" title="All numbers are generated sample data until the backend is connected">
          Sample data
        </span>
        <button onClick={onMethodology} className={ACTION}>
          Methodology
        </button>
        <a href={downloadHref} download className={ACTION}>
          Download CSV
        </a>
        {overview && <PanelToggle side="right" open={panels.rightOpen} onClick={panels.toggleRight} />}
      </div>
    </header>
  );
});
