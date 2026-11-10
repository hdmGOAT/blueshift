"use client";

// Zoom / pan state and pointer handling for the map. Rendering lives in
// OceanLens.tsx; the maths lives in geometry.ts.
import { useCallback, useEffect, useRef, useState } from "react";
import type { RegionId } from "@/lib/data";
import { CX, CY, HOME, K_MAX, K_MIN, clampView, inLens, lonLatAt, toBase, type View } from "./geometry";

/** `bx`/`by` are the tapped point in base space, `k` the zoom at that moment. */
export type MapTap = { region: RegionId | null; bx: number; by: number; k: number; shiftKey: boolean };
export type FlyTo = (target: View, ms?: number) => void;
export type MapHover = { region: RegionId | null; lonLat: [number, number]; clientX: number; clientY: number };

type Options = {
  /** A click or tap that was not a drag. `region` is null over water. */
  onTap: (tap: MapTap, flyTo: FlyTo) => void;
  /** Mouse moved inside the lens (null when it leaves or a drag starts). */
  onHover: (hover: MapHover | null) => void;
};

type Drag = { sx: number; sy: number; vx: number; vy: number; moved: boolean; region: RegionId | null };

const DRAG_THRESHOLD = 4; // viewBox px before a press counts as a drag
const WHEEL_SPEED = 0.0022;

const regionAt = (target: EventTarget | null) =>
  ((target as Element | null)?.closest?.("[data-region]")?.getAttribute("data-region") ?? null) as RegionId | null;

export function useMapView({ onTap, onHover }: Options) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(HOME);
  const [dragging, setDragging] = useState(false);
  // Mirrors `view` so event handlers always read the latest value.
  const viewRef = useRef<View>(HOME);
  const anim = useRef<number | null>(null);
  const drag = useRef<Drag | null>(null);

  const commit = useCallback((v: View) => {
    viewRef.current = v;
    setView(v);
  }, []);

  const cancelAnimation = useCallback(() => {
    if (anim.current !== null) cancelAnimationFrame(anim.current);
    anim.current = null;
  }, []);
  useEffect(() => cancelAnimation, [cancelAnimation]);

  /** Animate to a view (clamped to Mindanao). */
  const flyTo: FlyTo = useCallback(
    (target, ms = 560) => {
      cancelAnimation();
      const from = viewRef.current;
      const to = clampView(target);
      if (Math.abs(from.x - to.x) < 0.01 && Math.abs(from.y - to.y) < 0.01 && Math.abs(from.k - to.k) < 0.001) return;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = 1 - Math.pow(1 - t, 3); // ease-out
        commit({
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          k: Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * e),
        });
        anim.current = t < 1 ? requestAnimationFrame(step) : null;
      };
      anim.current = requestAnimationFrame(step);
    },
    [cancelAnimation, commit],
  );

  const zoomBy = useCallback((factor: number) => flyTo({ ...viewRef.current, k: viewRef.current.k * factor }, 320), [flyTo]);

  const svgPoint = (clientX: number, clientY: number) => {
    const pt = new DOMPoint(clientX, clientY).matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
    return [pt.x, pt.y] as const;
  };

  // Wheel zooms toward the cursor. Registered natively because React's wheel
  // listener is passive and could not stop the page from scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
      if (!inLens(pt.x, pt.y)) return;
      e.preventDefault();
      cancelAnimation();
      const v = viewRef.current;
      const k = Math.min(K_MAX, Math.max(K_MIN, v.k * Math.exp(-e.deltaY * WHEEL_SPEED)));
      const [bx, by] = toBase(v, pt.x, pt.y);
      commit(clampView({ k, x: bx - (pt.x - CX) / k, y: by - (pt.y - CY) / k }));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [cancelAnimation, commit]);

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      const [sx, sy] = svgPoint(e.clientX, e.clientY);
      if (!inLens(sx, sy)) return;
      // Read the region before capture retargets later events to the <svg>.
      const region = regionAt(e.target);
      e.currentTarget.setPointerCapture(e.pointerId);
      cancelAnimation();
      drag.current = { sx, sy, vx: viewRef.current.x, vy: viewRef.current.y, moved: false, region };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const [sx, sy] = svgPoint(e.clientX, e.clientY);
      const d = drag.current;
      if (!d) {
        if (e.pointerType !== "mouse") return;
        onHover(inLens(sx, sy) ? { region: regionAt(e.target), lonLat: lonLatAt(viewRef.current, sx, sy), clientX: e.clientX, clientY: e.clientY } : null);
        return;
      }
      if (!d.moved && Math.hypot(sx - d.sx, sy - d.sy) < DRAG_THRESHOLD) return;
      if (!d.moved) {
        d.moved = true;
        setDragging(true);
        onHover(null);
      }
      const k = viewRef.current.k;
      commit(clampView({ k, x: d.vx - (sx - d.sx) / k, y: d.vy - (sy - d.sy) / k }));
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      setDragging(false);
      if (!d || d.moved) return;
      const [bx, by] = toBase(viewRef.current, d.sx, d.sy);
      onTap({ region: d.region, bx, by, k: viewRef.current.k, shiftKey: e.shiftKey }, flyTo);
    },
    onPointerLeave: () => onHover(null),
    onPointerCancel: () => {
      drag.current = null;
      setDragging(false);
    },
  };

  return { svgRef, view, dragging, flyTo, zoomBy, handlers };
}
