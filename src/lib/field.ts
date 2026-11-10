import { scaleLinear, scaleLog } from "d3-scale";
import { OCEAN, type Layer } from "./data";

// Synthetic gridded ocean field standing in for NASA MODIS-Aqua L3 tiles.
export const FIELD_BOUNDS = { west: 118.4, east: 128.2, south: 3.6, north: 11.4 };
export const FIELD_STEP = 0.1;

const blob = (lon: number, lat: number, cx: number, cy: number, s: number) =>
  Math.exp(-((lon - cx) ** 2 + (lat - cy) ** 2) / (2 * s * s));

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

export const SST_DOMAIN = [27.8, 30.6] as const;
export const CHL_DOMAIN = [0.06, 1.0] as const;

const SST_STOPS = ["#034078", "#1282a2", "#7cc6d6", "#ebe6d6", "#eba571", "#d4583a", "#8e2a1c"];
const CHL_STOPS = ["#0c3a5e", "#11607a", "#1f8a7a", "#5fae5f", "#b9d46c", "#f1e9a6"];

export const sstColor = scaleLinear<string>()
  .domain(SST_STOPS.map((_, i) => SST_DOMAIN[0] + ((SST_DOMAIN[1] - SST_DOMAIN[0]) * i) / (SST_STOPS.length - 1)))
  .range(SST_STOPS)
  .clamp(true);

const chlLog = scaleLog().domain(CHL_DOMAIN).range([0, 1]).clamp(true);
const chlLin = scaleLinear<string>()
  .domain(CHL_STOPS.map((_, i) => i / (CHL_STOPS.length - 1)))
  .range(CHL_STOPS);
export const chlColor = (v: number) => chlLin(chlLog(v));

export const SST_GRADIENT = SST_STOPS;
export const CHL_GRADIENT = CHL_STOPS;

export function renderField(layer: Layer, index: number): string {
  const { west, east, south, north } = FIELD_BOUNDS;
  const cols = Math.round((east - west) / FIELD_STEP);
  const rows = Math.round((north - south) / FIELD_STEP);
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(cols, rows);
  for (let r = 0; r < rows; r++) {
    const lat = north - (r + 0.5) * FIELD_STEP;
    for (let c = 0; c < cols; c++) {
      const lon = west + (c + 0.5) * FIELD_STEP;
      const col = layer === "sst" ? sstColor(sstAt(lon, lat, index)) : chlColor(chlAt(lon, lat, index));
      const n = parseRgb(col);
      const k = (r * cols + c) * 4;
      img.data[k] = n[0];
      img.data[k + 1] = n[1];
      img.data[k + 2] = n[2];
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

function parseRgb(s: string): [number, number, number] {
  if (s.startsWith("#")) {
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  }
  const m = s.match(/\d+/g)!;
  return [+m[0], +m[1], +m[2]];
}
