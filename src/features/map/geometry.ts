// Map geometry. Pure functions and constants, no React.
//
// HOW THE MAP WORKS
// 1. Every shape is projected ONCE, here, into "base" pixel space: the SVG
//    viewBox (W x H) with Mindanao fitted inside the circular lens.
// 2. Zoom and pan never re-project. A `View` { x, y, k } says which base pixel
//    sits at the lens centre and at what zoom. The map layers are wrapped in
//    one <g transform={viewTransform(view)}>, so a frame of zooming is a
//    single attribute change.
// 3. Things that must not scale (labels, scale bar) are drawn outside that
//    group and placed with toScreen().
import { geoGraticule, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import context from "@/data/context.json";
import mindanao from "@/data/mindanao.json";
import { PROVINCE_BY_NAME, REGIONS, REGION_BY_PSGC, SEAS, type RegionId } from "@/lib/data";
import { FIELD_BOUNDS } from "@/lib/field";

// ---- Layout (SVG viewBox units) ---------------------------------------------

export const W = 900;
export const H = 860;
/** Lens centre and radius. */
export const CX = W / 2;
export const CY = H / 2 - 6;
export const R = 236;
/** Radius of the circle the species bubbles sit on. */
export const RING = R + 64;
export const K_MIN = 1;
export const K_MAX = 10;

// ---- Projection ---------------------------------------------------------------

const projection = geoMercator().fitExtent(
  [
    [CX - R * 0.94, CY - R * 0.84],
    [CX + R * 0.94, CY + R * 0.84],
  ],
  { type: "MultiPoint", coordinates: [[120.6, 4.9], [126.7, 10.0]] },
);
const path = geoPath(projection);

// ---- View transform -----------------------------------------------------------

/** Base pixel (x, y) shown at the lens centre, at zoom k. */
export type View = { x: number; y: number; k: number };
type XY = readonly [number, number];

/** Screen (viewBox) point -> base point. */
export const toBase = (v: View, sx: number, sy: number): XY => [(sx - CX) / v.k + v.x, (sy - CY) / v.k + v.y];
/** Base point -> screen (viewBox) point. */
export const toScreen = (v: View, bx: number, by: number): XY => [(bx - v.x) * v.k + CX, (by - v.y) * v.k + CY];
/** SVG transform that applies a view to shapes drawn in base space. */
export const viewTransform = (v: View) => `translate(${CX - v.x * v.k} ${CY - v.y * v.k}) scale(${v.k})`;
export const inLens = (sx: number, sy: number) => (sx - CX) ** 2 + (sy - CY) ** 2 <= R * R;
/** Longitude/latitude under a screen point. */
export const lonLatAt = (v: View, sx: number, sy: number) => projection.invert!(toBase(v, sx, sy) as [number, number]) as [number, number];

// ---- Static shapes (base space) -----------------------------------------------

const MIND = mindanao as FeatureCollection;
const CTX = context as FeatureCollection;
const regionOf = (f: Feature) => REGION_BY_PSGC[(f.properties as { region: number }).region];
const byRegion = <T>(fn: (id: RegionId, fc: FeatureCollection) => T) =>
  Object.fromEntries(
    REGIONS.map((r) => [r.id, fn(r.id, { type: "FeatureCollection", features: MIND.features.filter((f) => regionOf(f) === r.id) })]),
  ) as Record<RegionId, T>;

/** Neighbouring islands (Visayas, Palawan), one combined path. */
export const CONTEXT_PATH = CTX.features.map((f) => path(f) ?? "").join("");

/** All provinces of a region as one path (province borders included). */
export const REGION_PATH = byRegion((_, fc) => path(fc) ?? "");
export const REGION_CENTROID = byRegion((_, fc) => path.centroid(fc) as [number, number]);
const REGION_BOUNDS = byRegion((_, fc) => path.bounds(fc));

const NOT_PROVINCES = ["Special Geographic Area"];
/** Province label anchors. `area` is in base px², multiply by k² for screen area. */
export const PROVINCE_LABELS = MIND.features
  .map((f) => {
    const [x, y] = path.centroid(f);
    return { name: (f.properties as { name: string }).name, x, y, area: path.area(f) };
  })
  .filter((p) => !p.name.includes("Not a Province") && !NOT_PROVINCES.includes(p.name));

/** Each listed province's own path, for choropleth maps (see ProvinceMap.tsx). */
export const PROVINCE_SHAPES = MIND.features.flatMap((f) => {
  const p = PROVINCE_BY_NAME[(f.properties as { name: string }).name];
  return p ? [{ id: p.id, name: p.name, d: path(f) ?? "", centroid: path.centroid(f) as [number, number] }] : [];
});
/** Unlisted areas (Isabela City, Special Geographic Area), drawn as plain land. */
export const OTHER_LAND_PATH = MIND.features.filter((f) => !PROVINCE_BY_NAME[(f.properties as { name: string }).name]).map((f) => path(f) ?? "").join("");

export const SEA_POINTS = SEAS.map((s) => {
  const [x, y] = projection([s.lon, s.lat])!;
  return { ...s, x, y };
});

const graticule = (step: number) => path(geoGraticule().step([step, step]).extent([[116, 2], [130, 13]])()) ?? "";
/** Lat/lon grid at 1° and 0.5°. */
export const GRATICULE = { coarse: graticule(1), fine: graticule(0.5) };

const [fx0, fy0] = projection([FIELD_BOUNDS.west, FIELD_BOUNDS.north])!;
const [fx1, fy1] = projection([FIELD_BOUNDS.east, FIELD_BOUNDS.south])!;
/** Where the ocean raster (src/lib/field.ts) sits. */
export const FIELD_RECT = { x: fx0, y: fy0, width: fx1 - fx0, height: fy1 - fy0 };

// ---- View limits ----------------------------------------------------------------

const LAND = path.bounds(MIND);
/** Mindanao's bounding box in base space, padded, as an SVG viewBox. */
export const LAND_VIEWBOX = `${LAND[0][0] - 4} ${LAND[0][1] - 10} ${LAND[1][0] - LAND[0][0] + 14} ${LAND[1][1] - LAND[0][1] + 20}`;
const clampAxis = (c: number, lo: number, hi: number, half: number) =>
  lo + half > hi - half ? (lo + hi) / 2 : Math.min(hi - half, Math.max(lo + half, c));

/**
 * Keep the user on Mindanao: zoom stays in [K_MIN, K_MAX] and the lens may
 * only travel inside the land's bounding box.
 */
export function clampView(v: View): View {
  const k = Math.min(K_MAX, Math.max(K_MIN, v.k));
  const half = (R * 0.9) / k;
  return { k, x: clampAxis(v.x, LAND[0][0], LAND[1][0], half), y: clampAxis(v.y, LAND[0][1], LAND[1][1], half) };
}

/** The default, fully zoomed-out view. */
export const HOME: View = clampView({ x: CX, y: CY, k: 1 });

/** The view that frames each region. */
export const REGION_VIEW = byRegion((id) => {
  const [[x0, y0], [x1, y1]] = REGION_BOUNDS[id];
  const k = Math.min(K_MAX, Math.max(1.3, (1.5 * R) / Math.max(x1 - x0, y1 - y0)));
  return clampView({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, k });
});

export const isHome = (v: View) => v.k < 1.02 && Math.abs(v.x - HOME.x) < 1 && Math.abs(v.y - HOME.y) < 1;

// ---- Scale bar ------------------------------------------------------------------

const NICE_KM = [10, 20, 25, 50, 100, 200];
const EARTH_RADIUS_KM = 6371;

/** A round distance whose bar is about 70px wide at the current view. */
export function scaleBar(v: View) {
  const [, lat] = projection.invert!([v.x, v.y])!;
  const pxPerKm = (projection.scale() * v.k) / (EARTH_RADIUS_KM * Math.cos((lat * Math.PI) / 180));
  const km = NICE_KM.reduce((best, n) => (Math.abs(n * pxPerKm - 70) < Math.abs(best * pxPerKm - 70) ? n : best), NICE_KM[0]);
  return { km, px: km * pxPerKm };
}
