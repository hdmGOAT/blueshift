// The coloured ocean layer on the map.
// SAMPLE: a synthetic gridded field standing in for NASA MODIS-Aqua L3 tiles.
// With real data, replace sstAt/chlAt with lookups into the fetched grid.
//
// Performance: colours come from a 256-step lookup table, and each rendered
// frame (layer + quarter) is cached, so replaying the timeline costs nothing.
import { OCEAN, type Layer } from "./data";

export const FIELD_BOUNDS = { west: 118.4, east: 128.2, south: 3.6, north: 11.4 };
const FIELD_STEP = 0.1; // degrees per pixel

const blob = (lon: number, lat: number, cx: number, cy: number, s: number) =>
  Math.exp(-((lon - cx) ** 2 + (lat - cy) ** 2) / (2 * s * s));

/** Sea-surface temperature (°C) at a point for one quarter. */
export function sstAt(lon: number, lat: number, index: number) {
  const o = OCEAN.all[index];
  const q = (index % 4) + 1;
  let v = o.sst;
  v += 0.35 * blob(lon, lat, 121, 8.2, 1.4); // warm, enclosed Sulu Sea
  v += 0.18 * blob(lon, lat, 123.5, 5.0, 1.6); // Celebes Sea
  v -= 0.25 * Math.max(0, (lon - 126.2) / 2); // Pacific-facing coast
  v -= 0.45 * blob(lon, lat, 122.6, 8.9, 0.55); // Zamboanga upwelling
  v -= 0.2 * blob(lon, lat, 124.4, 9.4, 0.7); // Bohol Sea
  if (q === 1) v -= 0.12 * (lat - 7);
  if (q === 3) v += 0.08 * (lat - 7);
  v += 0.06 * Math.sin(lon * 2.3 + index * 0.4) * Math.cos(lat * 1.9);
  return v;
}

/** Chlorophyll-a (mg/m³) at a point for one quarter. */
export function chlAt(lon: number, lat: number, index: number) {
  const o = OCEAN.all[index];
  let v = o.chl * 0.55;
  const q = (index % 4) + 1;
  const up = q === 1 || q === 4 ? 1.25 : 0.8;
  v += 0.55 * up * blob(lon, lat, 122.6, 8.8, 0.45);
  v += 0.32 * blob(lon, lat, 125.65, 6.85, 0.35);
  v += 0.28 * blob(lon, lat, 123.95, 8.3, 0.3);
  v += 0.2 * blob(lon, lat, 125.4, 9.1, 0.3);
  v += 0.16 * blob(lon, lat, 124.0, 6.9, 0.5);
  v += 0.12 * blob(lon, lat, 122.0, 6.9, 0.5);
  v -= 0.04 * Math.max(0, lon - 126.4);
  v *= 1 + 0.12 * Math.sin(lon * 3.1 - index * 0.3) * Math.cos(lat * 2.7);
  return Math.max(0.05, v);
}

// ---- Colour ramps ----------------------------------------------------------

export const SST_DOMAIN = [27.8, 30.6] as const; // °C, linear
export const CHL_DOMAIN = [0.06, 1.0] as const; // mg/m³, log

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

  const { west, east, south, north } = FIELD_BOUNDS;
  const cols = Math.round((east - west) / FIELD_STEP);
  const rows = Math.round((north - south) / FIELD_STEP);
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(cols, rows);
  const lut = layer === "sst" ? SST_LUT : CHL_LUT;
  for (let r = 0; r < rows; r++) {
    const lat = north - (r + 0.5) * FIELD_STEP;
    for (let c = 0; c < cols; c++) {
      const lon = west + (c + 0.5) * FIELD_STEP;
      const t = layer === "sst" ? sstT(sstAt(lon, lat, index)) : chlT(chlAt(lon, lat, index));
      const j = Math.round(t * 255) * 3;
      const k = (r * cols + c) * 4;
      img.data[k] = lut[j];
      img.data[k + 1] = lut[j + 1];
      img.data[k + 2] = lut[j + 2];
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  frameCache.set(key, url);
  return url;
}
