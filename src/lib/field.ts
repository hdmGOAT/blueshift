// The coloured ocean layer on the map.
// The data file has one SST / chlorophyll-a value per province and quarter,
// not a satellite grid, so the sea between provinces is an inverse-distance
// weighted interpolation of the province values: a smooth picture of the
// observed numbers, not extra measurements. Swap in a real grid (e.g. NASA
// MODIS-Aqua L3 tiles) by replacing valueAt().
//
// Performance: weights are computed once per pixel, colours come from a
// 256-step lookup table, and each rendered frame (layer + quarter) is cached.
import { PROVINCES, PROVINCE_OCEAN, type Layer } from "./data";

export const FIELD_BOUNDS = { west: 118.4, east: 128.2, south: 3.6, north: 11.4 };
const FIELD_STEP = 0.1; // degrees per pixel
const COLS = Math.round((FIELD_BOUNDS.east - FIELD_BOUNDS.west) / FIELD_STEP);
const ROWS = Math.round((FIELD_BOUNDS.north - FIELD_BOUNDS.south) / FIELD_STEP);
/** Distance (degrees) added to every weight so values blend smoothly near a province centre. */
const SMOOTH = 0.35;

/** Inverse-distance weights (power 2) from one point to every province, normalised. */
function weights(lon: number, lat: number) {
  const w = PROVINCES.map((p) => 1 / ((p.lonLat[0] - lon) ** 2 + (p.lonLat[1] - lat) ** 2 + SMOOTH ** 2));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
}

let pixelWeights: Float32Array | null = null;
function getPixelWeights() {
  if (pixelWeights) return pixelWeights;
  const n = PROVINCES.length;
  pixelWeights = new Float32Array(COLS * ROWS * n);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) pixelWeights.set(weights(FIELD_BOUNDS.west + (c + 0.5) * FIELD_STEP, FIELD_BOUNDS.north - (r + 0.5) * FIELD_STEP), (r * COLS + c) * n);
  return pixelWeights;
}

/** Interpolated value at a point for one quarter (used by tests and tooltips). */
export function valueAt(layer: Layer, lon: number, lat: number, index: number) {
  return weights(lon, lat).reduce((a, w, i) => a + w * PROVINCE_OCEAN[PROVINCES[i].id][index][layer], 0);
}

// ---- Colour ramps ----------------------------------------------------------

export const SST_DOMAIN = [27.5, 31.0] as const; // °C, linear
export const CHL_DOMAIN = [0.1, 3.0] as const; // mg/m³, log

export const SST_GRADIENT = ["#034078", "#1282a2", "#7cc6d6", "#ebe6d6", "#eba571", "#d4583a", "#8e2a1c"];
export const CHL_GRADIENT = ["#0c3a5e", "#11607a", "#1f8a7a", "#5fae5f", "#b9d46c", "#f1e9a6"];

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** 256 RGB triples interpolated evenly across the colour stops. */
function buildLut(stops: string[]) {
  const rgb = stops.map(hex);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const p = (i / 255) * (rgb.length - 1);
    const a = Math.min(rgb.length - 2, Math.floor(p));
    const f = p - a;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = rgb[a][c] + (rgb[a + 1][c] - rgb[a][c]) * f;
  }
  return lut;
}
const SST_LUT = buildLut(SST_GRADIENT);
const CHL_LUT = buildLut(CHL_GRADIENT);

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const sstT = (v: number) => clamp01((v - SST_DOMAIN[0]) / (SST_DOMAIN[1] - SST_DOMAIN[0]));
const CHL_LOG_SPAN = Math.log(CHL_DOMAIN[1] / CHL_DOMAIN[0]);
const chlT = (v: number) => clamp01(Math.log(v / CHL_DOMAIN[0]) / CHL_LOG_SPAN);

/** CSS colour for one value on the layer's ramp (for choropleths). */
export function fieldColor(layer: Layer, v: number) {
  const lut = layer === "sst" ? SST_LUT : CHL_LUT;
  const j = Math.round((layer === "sst" ? sstT(v) : chlT(v)) * 255) * 3;
  return `rgb(${lut[j]},${lut[j + 1]},${lut[j + 2]})`;
}

// ---- Rendering -------------------------------------------------------------

const frameCache = new Map<string, string>();

/** A PNG data URL of the field for one layer and quarter. Browser only. */
export function renderField(layer: Layer, index: number): string {
  if (typeof document === "undefined") return "";
  const key = `${layer}:${index}`;
  const hit = frameCache.get(key);
  if (hit) return hit;

  const n = PROVINCES.length;
  const vals = PROVINCES.map((p) => PROVINCE_OCEAN[p.id][index][layer]);
  const w = getPixelWeights();
  const canvas = document.createElement("canvas");
  canvas.width = COLS;
  canvas.height = ROWS;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(COLS, ROWS);
  const lut = layer === "sst" ? SST_LUT : CHL_LUT;
  for (let px = 0; px < COLS * ROWS; px++) {
    let v = 0;
    for (let i = 0, o = px * n; i < n; i++) v += w[o + i] * vals[i];
    const j = Math.round((layer === "sst" ? sstT(v) : chlT(v)) * 255) * 3;
    const k = px * 4;
    img.data[k] = lut[j];
    img.data[k + 1] = lut[j + 1];
    img.data[k + 2] = lut[j + 2];
    img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  frameCache.set(key, url);
  return url;
}
