"use client";

// The dock at the bottom: play/pause, the current quarter, and a strip of
// quarters shaded by ocean anomaly. Click or drag the strip to scrub.
import { memo, useMemo, useRef } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { stripeColor } from "@/lib/colors";
import { OCEAN, QUARTERS, YEARS, quarterLabel, type Layer, type Scope } from "@/lib/data";

type Props = {
  index: number;
  setIndex: (i: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  layer: Layer;
  scope: Scope;
};

const N = QUARTERS.length;
const pct = (i: number) => `${((i / N) * 100).toFixed(3)}%`;

export const Timeline = memo(function Timeline({ index, setIndex, playing, setPlaying, layer, scope }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const colors = useMemo(() => OCEAN[scope].map((o) => stripeColor(layer, o)), [layer, scope]);

  const scrubTo = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    setIndex(Math.max(0, Math.min(N - 1, Math.floor(((clientX - left) / width) * N))));
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
      <button
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? "Pause" : "Play through quarters"}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-prussian transition-transform hover:scale-105"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="w-[76px] shrink-0">
        <div className="font-display text-[17px] font-medium leading-tight text-ink">{quarterLabel(index)}</div>
        <div className="text-[11px] text-ink-3">Observed</div>
      </div>

      <div className="min-w-0 flex-1">
        <div
          ref={trackRef}
          className="relative h-6 cursor-pointer touch-none"
          role="slider"
          tabIndex={0}
          aria-label="Quarter"
          aria-valuemin={0}
          aria-valuemax={N - 1}
          aria-valuenow={index}
          aria-valuetext={quarterLabel(index)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setPlaying(false);
            scrubTo(e.clientX);
          }}
          onPointerMove={(e) => e.buttons === 1 && scrubTo(e.clientX)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setIndex(Math.min(N - 1, index + 1));
            if (e.key === "ArrowLeft") setIndex(Math.max(0, index - 1));
          }}
        >
          <div className="absolute inset-0 flex gap-px overflow-hidden rounded-md">
            {QUARTERS.map((q) => (
              <div
                key={q.index}
                className={`h-full flex-1 ${q.q === 1 && q.index > 0 ? "ml-[2px]" : ""}`}
                style={{ background: colors[q.index], opacity: q.index > index ? 0.55 : 1 }}
              />
            ))}
          </div>
          <div
            className="pointer-events-none absolute -inset-y-1 rounded-md border-2 border-white shadow-[0_0_0_3px_rgba(10,17,40,0.6)]"
            style={{ left: `calc(${pct(index)} - 2px)`, width: `calc(${pct(1)} + 4px)`, transition: playing ? "left 200ms" : undefined }}
          />
        </div>
        <div className="relative mt-1 h-4">
          {YEARS.map((yr, i) => (
            <span key={yr} className={`absolute text-[10.5px] text-ink-3 ${(yr - YEARS[0]) % 2 ? "hidden" : (yr - YEARS[0]) % 4 ? "max-sm:hidden" : ""}`} style={{ left: pct(i * 4) }}>
              {yr}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});
