"use client";

import { useEffect, useRef } from "react";
import credits from "@/data/fish-credits.json";

// `flip` mirrors photos so every fish faces left, head first.
type Credit = { file: string; source: string; license: string; artist: string; flip?: boolean };
const CREDITS = credits as Record<string, Credit>;

// Theme ramp, dark → light. Darkest step sits just above the panel colour so
// shadows read as fish, not holes.
const PALETTE: [number, number, number][] = [
  [0x0b, 0x22, 0x55],
  [0x03, 0x40, 0x78],
  [0x12, 0x82, 0xa2],
  [0x5c, 0xc0, 0xdc],
  [0xe4, 0xf2, 0xf6],
];

// 4×4 Bayer matrix, normalised to (-0.5, 0.5)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

const hash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

const cache = new Map<string, HTMLImageElement>();
function load(src: string) {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

type Rect = { x: number; y: number; w: number; h: number };

type Source = { el: CanvasImageSource; w: number; h: number };

function mirrored(img: HTMLImageElement): Source {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  return { el: c, w: c.width, h: c.height };
}

function dither(img: Source, canvas: HTMLCanvasElement, cols: number, src: Rect = { x: 0, y: 0, w: img.w, h: img.h }) {
  const rows = Math.max(1, Math.round((src.h / src.w) * cols));
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, cols, rows);
  ctx.drawImage(img.el, src.x, src.y, src.w, src.h, 0, 0, cols, rows);
  const px = ctx.getImageData(0, 0, cols, rows);
  const d = px.data;
  const n = cols * rows;

  // 1. Background: flood-fill from the border through pixels close to the
  //    average border colour. Works for studio / white-sheet fish photos.
  let br = 0, bg = 0, bb = 0, bc = 0;
  for (let x = 0; x < cols; x++)
    for (const y of [0, rows - 1]) {
      const k = (y * cols + x) * 4;
      br += d[k]; bg += d[k + 1]; bb += d[k + 2]; bc++;
    }
  for (let y = 0; y < rows; y++)
    for (const x of [0, cols - 1]) {
      const k = (y * cols + x) * 4;
      br += d[k]; bg += d[k + 1]; bb += d[k + 2]; bc++;
    }
  br /= bc; bg /= bc; bb /= bc;
  const isBg = new Uint8Array(n);
  const near = (i: number) => {
    const k = i * 4;
    if (d[k + 3] < 40) return true;
    return Math.hypot(d[k] - br, d[k + 1] - bg, d[k + 2] - bb) < 46;
  };
  const queue: number[] = [];
  for (let x = 0; x < cols; x++) queue.push(x, (rows - 1) * cols + x);
  for (let y = 0; y < rows; y++) queue.push(y * cols, y * cols + cols - 1);
  while (queue.length) {
    const i = queue.pop()!;
    if (isBg[i] || !near(i)) continue;
    isBg[i] = 1;
    const x = i % cols, y = (i / cols) | 0;
    if (x > 0) queue.push(i - 1);
    if (x < cols - 1) queue.push(i + 1);
    if (y > 0) queue.push(i - cols);
    if (y < rows - 1) queue.push(i + cols);
  }
  // If the fill ate almost nothing, the photo has a busy background: fall back
  // to a soft elliptical vignette instead.
  let bgCount = 0;
  for (let i = 0; i < n; i++) bgCount += isBg[i];
  const vignette = bgCount < n * 0.3;

  // 2. Luminance, contrast-stretched over the fish only.
  const lum = new Float32Array(n);
  const vals: number[] = [];
  for (let i = 0; i < n; i++) {
    const k = i * 4;
    lum[i] = (0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]) / 255;
    if (!isBg[i]) vals.push(lum[i]);
  }
  vals.sort((a, b) => a - b);
  const lo = vals[Math.floor(vals.length * 0.03)] ?? 0;
  const hi = vals[Math.floor(vals.length * 0.97)] ?? 1;

  // 3. Ordered dither into the palette; alpha dithered too for soft edges.
  const L = PALETTE.length - 1;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const k = i * 4;
      const b = BAYER[(y & 3) * 4 + (x & 3)];
      let a = isBg[i] ? 0 : 1;
      if (vignette) {
        const ex = (x / cols - 0.5) / 0.5, ey = (y / rows - 0.5) / 0.5;
        a = Math.max(0, Math.min(1, (1 - Math.hypot(ex, ey)) * 2.2));
      }
      if (a + b * 0.9 < 0.5) {
        d[k + 3] = 0;
        continue;
      }
      const t = Math.max(0, Math.min(1, (lum[i] - lo) / Math.max(0.05, hi - lo)));
      // light touch: gentle dither amplitude, and the darkest step drops out
      // so shadows and leftover background dissolve into the panel
      const level = Math.max(0, Math.min(L, Math.round(t * L + b * 0.6)));
      if (level === 0) {
        d[k + 3] = 0;
        continue;
      }
      const [r, g, bl] = PALETTE[level];
      d[k] = r; d[k + 1] = g; d[k + 2] = bl; d[k + 3] = 255;
    }
  // 4. Clear isolated specks (opaque pixels with fewer than 2 opaque neighbours).
  const op = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && d[(y * cols + x) * 4 + 3] > 0;
  const clear: number[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      if (!op(x, y)) continue;
      let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && op(x + dx, y + dy)) nb++;
      if (nb < 2) clear.push((y * cols + x) * 4 + 3);
    }
  for (const k of clear) d[k] = 0;

  // 5. Keep only blobs that belong to the fish: drop connected components much
  //    smaller than the largest (stray dots from the photo background).
  const label = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  for (let i = 0; i < n; i++) {
    if (label[i] !== -1 || !d[i * 4 + 3]) continue;
    const id = sizes.length;
    let size = 0;
    const stack = [i];
    label[i] = id;
    while (stack.length) {
      const j = stack.pop()!;
      size++;
      const x = j % cols, y = (j / cols) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y + 1], [x - 1, y + 1], [x + 1, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const m = ny * cols + nx;
        if (label[m] === -1 && d[m * 4 + 3]) {
          label[m] = id;
          stack.push(m);
        }
      }
    }
    sizes.push(size);
  }
  const biggest = Math.max(0, ...sizes);
  for (let i = 0; i < n; i++) if (label[i] >= 0 && sizes[label[i]] < biggest * 0.02) d[i * 4 + 3] = 0;
  ctx.putImageData(px, 0, 0);

  // Bounding box of the fish, ignoring sparse rows/columns, in source pixels.
  const colN = new Array(cols).fill(0), rowN = new Array(rows).fill(0);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (d[(y * cols + x) * 4 + 3]) {
        colN[x]++;
        rowN[y]++;
      }
  const first = (a: number[], t: number) => Math.max(0, a.findIndex((v) => v > t));
  const last = (a: number[], t: number) => a.length - 1 - Math.max(0, [...a].reverse().findIndex((v) => v > t));
  // keep thin tails and fin tips: any row/column with 2+ pixels counts
  const x0 = first(colN, 1), x1 = last(colN, 1);
  const y0 = first(rowN, 1), y1 = last(rowN, 1);
  const sx = src.w / cols, sy = src.h / rows;
  const pad = Math.max(4, Math.round(cols * 0.05));
  return {
    x: src.x + Math.max(0, x0 - pad) * sx,
    y: src.y + Math.max(0, y0 - pad) * sy,
    w: (Math.min(cols - 1, x1 + pad) - Math.max(0, x0 - pad) + 1) * sx,
    h: (Math.min(rows - 1, y1 + pad) - Math.max(0, y0 - pad) + 1) * sy,
  };
}

/** A species photo rendered as a dithered, palette-mapped bitmap. */
export function DitheredFish({ id, width, pixel = 2, className = "" }: { id: string; width: number; pixel?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const credit = CREDITS[id];

  useEffect(() => {
    if (!credit || !ref.current) return;
    let alive = true;
    // version the URL by source so a swapped photo never shows a cached copy
    load(`/fish/${credit.file}?v=${hash(credit.source)}`)
      .then((el) => {
        if (!alive || !ref.current) return;
        const img = credit.flip ? mirrored(el) : { el, w: el.naturalWidth, h: el.naturalHeight };
        const cols = Math.round(width / pixel);
        // pass 1 finds the fish, pass 2 re-dithers just that crop at full resolution
        const box = dither(img, ref.current, cols);
        if (box.w > 8 && box.h > 8) dither(img, ref.current, cols, box);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [credit, width, pixel]);

  if (!credit) return null;
  return <canvas ref={ref} aria-hidden className={className} style={{ width, height: "auto", imageRendering: "pixelated" }} />;
}

export function fishCredit(id: string) {
  return CREDITS[id];
}
