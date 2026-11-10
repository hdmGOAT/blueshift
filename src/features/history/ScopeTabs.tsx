"use client";

import { memo } from "react";
import { REGION_BY_ID, SCOPES, regionName, type Scope } from "@/lib/data";

/** Tab strip: All Mindanao plus each region. */
export const ScopeTabs = memo(function ScopeTabs({ scope, onScope }: { scope: Scope; onScope: (s: Scope) => void }) {
  return (
    <div className="scroll-thin flex gap-1 overflow-x-auto border-b border-line px-4 py-2">
      {SCOPES.map((s) => (
        <button
          key={s}
          onClick={() => onScope(s)}
          aria-pressed={scope === s}
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${scope === s ? "bg-hi text-ink" : "text-ink-3 hover:text-ink"}`}
        >
          {s !== "all" && <span className="h-2 w-2 rounded-full" style={{ background: REGION_BY_ID[s].color }} />}
          {regionName(s)}
        </button>
      ))}
    </div>
  );
});
