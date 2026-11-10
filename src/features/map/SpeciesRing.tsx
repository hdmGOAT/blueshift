"use client";

// The species bubbles around the lens, and the leader line from the selected
// bubble to where that species is landed. Memoised: unaffected by zoom/pan.
import { memo, useState } from "react";
import { corrColor } from "@/lib/colors";
import type { Corr, Layer } from "@/lib/data";
import { fmt } from "@/lib/format";
import { CX, CY, R } from "./geometry";
import type { Bubble } from "./ring";

type Props = {
  bubbles: Bubble[];
  selectedId: string;
  layer: Layer;
  /** Correlation per species id, for the current scope. */
  corr: Record<string, Corr>;
  onSelect: (id: string) => void;
};

export const SpeciesRing = memo(function SpeciesRing({ bubbles, selectedId, layer, corr, onSelect }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  return (
    <>
      {bubbles.map(({ species: s, angle, r, x, y, value }) => {
        const active = s.id === selectedId;
        const showValue = active || hoverId === s.id;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // Label sits just outside the bubble, on the side facing away from the map.
        const lx = x + cos * (r + 10);
        const ly = y + sin * (r + 10);
        const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
        const nameY = sin < -0.35 ? ly - (showValue ? 14 : 2) : sin > 0.35 ? ly + 12 : ly + 4;
        return (
          <g
            key={s.id}
            // Stop the map from treating a bubble press as a drag.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSelect(s.id)}
            onMouseEnter={() => setHoverId(s.id)}
            onMouseLeave={() => setHoverId(null)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(s.id)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`${s.local}, ${fmt(value)} tonnes`}
            aria-pressed={active}
          >
            {active && <circle cx={x} cy={y} r={r + 5} fill="none" stroke="var(--white)" strokeWidth={1.25} />}
            <circle cx={x} cy={y} r={r} fill={corrColor(corr[s.id][layer])} stroke="var(--paper)" strokeWidth={1.5} style={{ transition: "r 380ms cubic-bezier(.2,.7,.2,1)" }} />
            <text x={lx} y={nameY} textAnchor={anchor} fontSize={12.5} fontWeight={active ? 600 : 400} fill={active ? "var(--ink)" : "var(--ink-2)"}>
              {s.local}
            </text>
            {showValue && (
              <text x={lx} y={nameY + 15} textAnchor={anchor} fontSize={11} fill="var(--ink-3)">
                {fmt(value)} t
              </text>
            )}
          </g>
        );
      })}
    </>
  );
});

/** Dashed line from a bubble to a point on the map, clipped at the lens rim. */
export function Leader({ from, to }: { from: Bubble; to: readonly [number, number] }) {
  const dx = to[0] - CX;
  const dy = to[1] - CY;
  const dist = Math.hypot(dx, dy);
  const inside = dist <= R;
  const [ex, ey] = inside ? to : [CX + (dx / dist) * R, CY + (dy / dist) * R];
  return (
    <g pointerEvents="none">
      <path
        d={`M${from.x - Math.cos(from.angle) * from.r},${from.y - Math.sin(from.angle) * from.r} L${ex},${ey}`}
        stroke="rgba(254,252,251,0.7)"
        strokeWidth={1}
        fill="none"
        strokeDasharray="2 4"
      />
      {inside && <circle cx={ex} cy={ey} r={3} fill="var(--white)" />}
    </g>
  );
}
