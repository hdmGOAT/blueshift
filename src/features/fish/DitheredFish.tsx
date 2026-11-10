"use client";

import { memo, useEffect, useRef } from "react";
import { fishCredit, fishUrl, type FishCredit } from "./credits";
import { ditherFish } from "./dither";

// Each photo is downloaded once and each (photo, size) is dithered once.
const images = new Map<string, Promise<HTMLImageElement>>();
const rendered = new Map<string, HTMLCanvasElement>();

function loadImage(src: string) {
  let p = images.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
}

async function renderFish(credit: FishCredit, cols: number) {
  const key = `${fishUrl(credit)}@${cols}`;
  let canvas = rendered.get(key);
  if (!canvas) {
    canvas = ditherFish(await loadImage(fishUrl(credit)), cols, credit.flip);
    rendered.set(key, canvas);
  }
  return canvas;
}

type Props = {
  /** Species id. Renders nothing if the species has no photo. */
  id: string;
  /** Displayed width in CSS pixels. */
  width: number;
  /** Size of one dither dot in CSS pixels. */
  pixel?: number;
  className?: string;
};

/** A species photo as a dithered bitmap in the theme's blues, facing left. */
export const DitheredFish = memo(function DitheredFish({ id, width, pixel = 2, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const credit = fishCredit(id);

  useEffect(() => {
    if (!credit) return;
    let alive = true;
    renderFish(credit, Math.round(width / pixel))
      .then((src) => {
        const canvas = ref.current;
        if (!alive || !canvas) return;
        canvas.width = src.width;
        canvas.height = src.height;
        canvas.getContext("2d")!.drawImage(src, 0, 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [credit, width, pixel]);

  if (!credit) return null;
  return <canvas ref={ref} aria-hidden className={className} style={{ width, height: "auto", imageRendering: "pixelated" }} />;
});
