// Turns a fish photo into a small dithered bitmap in the theme's blues.
// Browser only (uses canvas). No React.
//
// Steps, in ditherPass():
//   1. findBackground  flood-fill from the border to find the backdrop
//   2. contrastRange   luminance range of the fish itself
//   3. quantize        ordered (Bayer) dither into PALETTE, background -> transparent
//   4. despeckle       drop lone pixels
//   5. dropSmallBlobs  drop anything not attached to the fish
//   6. contentBox      bounding box of what is left
// ditherFish() runs the pass twice: once to find the fish, then again on just
// that crop so every species fills its box at full resolution.

// Dark -> light. Level 0 is never painted (it becomes transparent), so the
// darkest tones dissolve into the panel behind.
const PALETTE = [
  [0x0b, 0x22, 0x55],
  [0x03, 0x40, 0x78],
  [0x12, 0x82, 0xa2],
  [0x5c, 0xc0, 0xdc],
  [0xe4, 0xf2, 0xf6],
];

// 4x4 Bayer matrix, normalised to (-0.5, 0.5).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

const BACKGROUND_TOLERANCE = 46; // RGB distance from the border colour
const DITHER_STRENGTH = 0.6; // lower = flatter, higher = grainier
const MIN_BLOB_FRACTION = 0.02; // blobs smaller than this share of the largest are dropped

type Rect = { x: number; y: number; w: number; h: number };
type Source = { el: CanvasImageSource; w: number; h: number };
/** RGBA pixels plus grid size, shared by the steps below. */
type Grid = { d: Uint8ClampedArray; cols: number; rows: number };

const alphaAt = ({ d, cols }: Grid, x: number, y: number) => d[(y * cols + x) * 4 + 3];

function findBackground({ d, cols, rows }: Grid) {
  const n = cols * rows;
  const border: number[] = [];
  for (let x = 0; x < cols; x++) border.push(x, (rows - 1) * cols + x);
  for (let y = 0; y < rows; y++) border.push(y * cols, y * cols + cols - 1);

  let br = 0, bg = 0, bb = 0;
  for (const i of border) {
    br += d[i * 4];
    bg += d[i * 4 + 1];
    bb += d[i * 4 + 2];
  }
  br /= border.length;
  bg /= border.length;
  bb /= border.length;

  const near = (i: number) => d[i * 4 + 3] < 40 || Math.hypot(d[i * 4] - br, d[i * 4 + 1] - bg, d[i * 4 + 2] - bb) < BACKGROUND_TOLERANCE;
  const isBg = new Uint8Array(n);
  const queue = border;
  while (queue.length) {
    const i = queue.pop()!;
    if (isBg[i] || !near(i)) continue;
    isBg[i] = 1;
    const x = i % cols;
    const y = (i / cols) | 0;
    if (x > 0) queue.push(i - 1);
    if (x < cols - 1) queue.push(i + 1);
    if (y > 0) queue.push(i - cols);
    if (y < rows - 1) queue.push(i + cols);
  }
  let count = 0;
  for (let i = 0; i < n; i++) count += isBg[i];
  // A fill that found little means a busy backdrop: caller falls back to a vignette.
  return { isBg, plain: count >= n * 0.3 };
}

function luminance({ d, cols, rows }: Grid) {
  const lum = new Float32Array(cols * rows);
  for (let i = 0; i < lum.length; i++) lum[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
  return lum;
}

function contrastRange(lum: Float32Array, isBg: Uint8Array) {
  const vals: number[] = [];
  for (let i = 0; i < lum.length; i++) if (!isBg[i]) vals.push(lum[i]);
  vals.sort((a, b) => a - b);
  return { lo: vals[Math.floor(vals.length * 0.03)] ?? 0, hi: vals[Math.floor(vals.length * 0.97)] ?? 1 };
}

function quantize(grid: Grid, lum: Float32Array, isBg: Uint8Array, plain: boolean, lo: number, hi: number) {
  const { d, cols, rows } = grid;
  const top = PALETTE.length - 1;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const k = i * 4;
      const b = BAYER[(y & 3) * 4 + (x & 3)];
      let alpha = isBg[i] ? 0 : 1;
      if (!plain) {
        const ex = (x / cols - 0.5) / 0.5;
        const ey = (y / rows - 0.5) / 0.5;
        alpha = Math.max(0, Math.min(1, (1 - Math.hypot(ex, ey)) * 2.2));
      }
      const t = Math.max(0, Math.min(1, (lum[i] - lo) / Math.max(0.05, hi - lo)));
      const level = Math.max(0, Math.min(top, Math.round(t * top + b * DITHER_STRENGTH)));
      if (alpha + b * 0.9 < 0.5 || level === 0) {
        d[k + 3] = 0;
        continue;
      }
      d[k] = PALETTE[level][0];
      d[k + 1] = PALETTE[level][1];
      d[k + 2] = PALETTE[level][2];
      d[k + 3] = 255;
    }
}

function despeckle(grid: Grid) {
  const { d, cols, rows } = grid;
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && alphaAt(grid, x, y) > 0;
  const clear: number[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      if (!opaque(x, y)) continue;
      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && opaque(x + dx, y + dy)) neighbours++;
      if (neighbours < 2) clear.push((y * cols + x) * 4 + 3);
    }
  for (const k of clear) d[k] = 0;
}

function dropSmallBlobs({ d, cols, rows }: Grid) {
  const n = cols * rows;
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
      const x = j % cols;
      const y = (j / cols) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
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
  for (let i = 0; i < n; i++) if (label[i] >= 0 && sizes[label[i]] < biggest * MIN_BLOB_FRACTION) d[i * 4 + 3] = 0;
}

/** Bounding box of opaque pixels, padded, in source-image pixels. */
function contentBox(grid: Grid, src: Rect): Rect {
  const { cols, rows } = grid;
  const colN = new Array<number>(cols).fill(0);
  const rowN = new Array<number>(rows).fill(0);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (alphaAt(grid, x, y)) {
        colN[x]++;
        rowN[y]++;
      }
  // A row/column needs 2+ pixels to count, so thin tails and fin tips survive.
  const first = (a: number[]) => Math.max(0, a.findIndex((v) => v > 1));
  const last = (a: number[]) => a.length - 1 - Math.max(0, [...a].reverse().findIndex((v) => v > 1));
  const pad = Math.max(4, Math.round(cols * 0.05));
  const x0 = Math.max(0, first(colN) - pad);
  const x1 = Math.min(cols - 1, last(colN) + pad);
  const y0 = Math.max(0, first(rowN) - pad);
  const y1 = Math.min(rows - 1, last(rowN) + pad);
  const sx = src.w / cols;
  const sy = src.h / rows;
  return { x: src.x + x0 * sx, y: src.y + y0 * sy, w: (x1 - x0 + 1) * sx, h: (y1 - y0 + 1) * sy };
}

/** Dither `src` (a region of `img`) onto `canvas`, `cols` pixels wide. Returns the fish's box. */
function ditherPass(img: Source, canvas: HTMLCanvasElement, cols: number, src: Rect): Rect {
  const rows = Math.max(1, Math.round((src.h / src.w) * cols));
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, cols, rows);
  ctx.drawImage(img.el, src.x, src.y, src.w, src.h, 0, 0, cols, rows);
  const px = ctx.getImageData(0, 0, cols, rows);
  const grid: Grid = { d: px.data, cols, rows };

  const { isBg, plain } = findBackground(grid);
  const lum = luminance(grid);
  const { lo, hi } = contrastRange(lum, isBg);
  quantize(grid, lum, isBg, plain, lo, hi);
  despeckle(grid);
  dropSmallBlobs(grid);
  ctx.putImageData(px, 0, 0);
  return contentBox(grid, src);
}

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

/** Dithered, auto-cropped rendering of a fish photo, `cols` pixels wide. */
export function ditherFish(el: HTMLImageElement, cols: number, flip = false): HTMLCanvasElement {
  const img: Source = flip ? mirrored(el) : { el, w: el.naturalWidth, h: el.naturalHeight };
  const canvas = document.createElement("canvas");
  const box = ditherPass(img, canvas, cols, { x: 0, y: 0, w: img.w, h: img.h });
  if (box.w > 8 && box.h > 8) ditherPass(img, canvas, cols, box);
  return canvas;
}
