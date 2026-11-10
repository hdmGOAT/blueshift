"use client";

import { useRef } from "react";
import { FORECAST_INDEX, OCEAN, QUARTERS, quarterLabel, type Layer, type Scope } from "@/lib/data";
import { anomalyColor } from "@/lib/colors";

type Props = {
  index: number;
  setIndex: (i: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  layer: Layer;
  scope: Scope;
};

export function Timeline({ index, setIndex, playing, setPlaying, layer, scope }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const n = QUARTERS.length;
  const oc = OCEAN[scope];

  const fromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    setIndex(Math.max(0, Math.min(n - 1, Math.floor(((clientX - left) / width) * n))));
  };

  // chlorophyll anomalies are ~10x smaller; flip sign so "greener" reads cool
  const stripe = (i: number) => (layer === "sst" ? anomalyColor(oc[i].sstAnom - 0.05) : anomalyColor(-(oc[i].chlAnom + 0.03) * 9));
  const isFc = index === FORECAST_INDEX;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
      <button
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? "Pause" : "Play through quarters"}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-prussian transition-transform hover:scale-105"
      >
        {playing ? (
          <svg width="10" height="12" viewBox="0 0 10 12"><rect width="3" height="12" rx="1" fill="currentColor" /><rect x="7" width="3" height="12" rx="1" fill="currentColor" /></svg>
        ) : (
          <svg width="11" height="12" viewBox="0 0 11 12"><path d="M1 1.2v9.6a.6.6 0 0 0 .9.5l8.2-4.8a.6.6 0 0 0 0-1L1.9.7a.6.6 0 0 0-.9.5Z" fill="currentColor" /></svg>
        )}
      </button>

      <div className="w-[76px] shrink-0">
        <div className={`font-display text-[17px] font-medium leading-tight ${isFc ? "text-forecast" : "text-ink"}`}>{quarterLabel(index)}</div>
        <div className="text-[11px] text-ink-3">{isFc ? "Projected" : "Observed"}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div
          ref={trackRef}
          className="relative h-6 cursor-pointer touch-none"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setPlaying(false);
            fromPointer(e.clientX);
          }}
          onPointerMove={(e) => e.buttons === 1 && fromPointer(e.clientX)}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={index}
          aria-valuetext={quarterLabel(index)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setIndex(Math.min(n - 1, index + 1));
            if (e.key === "ArrowLeft") setIndex(Math.max(0, index - 1));
          }}
        >
          <div className="absolute inset-0 flex gap-[2px] overflow-hidden rounded-md">
            {QUARTERS.map((q) => (
              <div
                key={q.index}
                className={`h-full flex-1 ${q.q === 1 && q.index > 0 ? "ml-[3px]" : ""}`}
                style={
                  q.index === FORECAST_INDEX
                    ? { background: "repeating-linear-gradient(45deg, rgba(232,184,92,0.5) 0 2px, transparent 2px 5px)" }
                    : { background: stripe(q.index), opacity: q.index > index ? 0.55 : 1 }
                }
              />
            ))}
          </div>
          <div
            className="pointer-events-none absolute -inset-y-1 rounded-md border-2 border-white shadow-[0_0_0_3px_rgba(10,17,40,0.6)]"
            style={{ left: `calc(${((index / n) * 100).toFixed(3)}% - 2px)`, width: `calc(${(100 / n).toFixed(3)}% + 4px)`, transition: playing ? "left 200ms" : undefined }}
          />
        </div>
        <div className="relative mt-1 h-4">
          {Array.from({ length: 11 }, (_, k) => 2016 + k).map((yr) => (
            <span key={yr} className={`absolute text-[10.5px] text-ink-3 ${yr % 2 ? "max-sm:hidden" : ""}`} style={{ left: `${((((yr - 2016) * 4) / n) * 100).toFixed(3)}%` }}>
              {yr}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
