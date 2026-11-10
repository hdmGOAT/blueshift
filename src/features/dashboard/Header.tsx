"use client";

import { memo } from "react";
import { BrandMark, PanelIcon } from "@/components/ui/icons";
import { REGIONS, type Scope } from "@/lib/data";

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
  scope: Scope;
  onScope: (s: Scope) => void;
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
};

/** Top bar: brand, region picker, data sources, panel toggles. */
export const Header = memo(function Header({ scope, onScope, leftOpen, rightOpen, onToggleLeft, onToggleRight }: Props) {
  return (
    <header className="relative z-20 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pt-3 lg:absolute lg:inset-x-0 lg:top-0">
      <PanelToggle side="left" open={leftOpen} onClick={onToggleLeft} />
      <div className="flex items-center gap-2.5">
        <BrandMark />
        <span className="font-display text-[19px] font-semibold">BlueShift</span>
      </div>

      <div className="glass flex items-center gap-1 rounded-full py-0.5 pl-3 pr-1 text-[12.5px]">
        <span className="text-ink-3">Mindanao</span>
        <span className="text-ink-3">/</span>
        <select value={scope} onChange={(e) => onScope(e.target.value as Scope)} aria-label="Region" className="cursor-pointer rounded-full bg-transparent py-1 pl-1 pr-1 font-medium text-ink outline-none">
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="label hidden md:inline">Sources · NASA OB.DAAC · PSA</span>
        <span className="label rounded-full bg-hi px-2.5 py-1 !text-ink-2">Sample data</span>
        <PanelToggle side="right" open={rightOpen} onClick={onToggleRight} />
      </div>
    </header>
  );
});
