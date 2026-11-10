// Text drawn OVER the map: region, province and sea names, and the scale bar.
// These sit outside the zoom transform so the type stays one size; positions
// come from toScreen(). They re-render on every zoom frame, so keep them cheap.
import type { CSSProperties } from "react";
import { REGIONS, type Scope } from "@/lib/data";
import { CX, CY, PROVINCE_LABELS, R, REGION_CENTROID, SEA_POINTS, inLens, scaleBar, toScreen, type View } from "./geometry";

const HALO: CSSProperties = { paintOrder: "stroke", stroke: "rgba(10,17,40,0.75)", strokeWidth: 3, strokeLinejoin: "round" };
const LAND_HALO: CSSProperties = { ...HALO, stroke: "rgba(22,36,74,0.9)" };

/** Zoom levels at which labels change. */
const FULL_REGION_NAMES_AT = 1.6;
const ALL_SEAS_AT = 1.8;
const PROVINCES_AT = 2.6;
/** A province is labelled once it covers this many screen px². */
const MIN_LABEL_AREA = 2200;
const ALWAYS_SHOWN_SEAS = ["sulu", "celebes", "bohol"];

export function MapLabels({ view, scope }: { view: View; scope: Scope }) {
  const k = view.k;
  return (
    <g pointerEvents="none">
      {k < PROVINCES_AT
        ? REGIONS.map((r) => {
            const [x, y] = toScreen(view, ...REGION_CENTROID[r.id]);
            const full = k >= FULL_REGION_NAMES_AT;
            return (
              <text key={r.id} x={x} y={y} textAnchor="middle" fontSize={full ? 11.5 : 10.5} fontWeight={600} fill={scope === r.id ? "var(--white)" : "var(--ink-2)"} style={LAND_HALO}>
                {full ? r.name : r.short}
              </text>
            );
          })
        : PROVINCE_LABELS.map((p) => {
            const [x, y] = toScreen(view, p.x, p.y);
            if (p.area * k * k < MIN_LABEL_AREA || !inLens(x, y)) return null;
            return (
              <text key={p.name} x={x} y={y} textAnchor="middle" fontSize={10.5} fill="var(--ink-2)" style={LAND_HALO}>
                {p.name}
              </text>
            );
          })}

      {SEA_POINTS.filter((s) => k >= ALL_SEAS_AT || ALWAYS_SHOWN_SEAS.includes(s.id)).map((s) => {
        const [x, y] = toScreen(view, s.x, s.y);
        return (
          <text key={s.id} x={x} y={y} textAnchor={s.anchor ?? "middle"} fontSize={10.5} fontStyle="italic" letterSpacing="0.02em" fill="rgba(254,252,251,0.55)" style={HALO}>
            {s.name}
          </text>
        );
      })}
    </g>
  );
}

export function ScaleBar({ view }: { view: View }) {
  const { km, px } = scaleBar(view);
  return (
    <g transform={`translate(${CX - px / 2}, ${CY + R - 30})`} pointerEvents="none">
      <path d={`M0,0 v4 h${px} v-4`} fill="none" stroke="var(--white)" strokeWidth={1.2} style={HALO} />
      <text x={px / 2} y={-4} textAnchor="middle" fontSize={10} fill="var(--white)" style={HALO}>
        {km} km
      </text>
    </g>
  );
}
