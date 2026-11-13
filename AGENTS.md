<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working in this repo

BlueShift relates ocean conditions (NASA SST and chlorophyll-a) to Philippine fisheries production (PSA) across Mindanao. It is a single-page app with five views: **Overview** (the map ringed by species, panels, timeline), **Ocean Monitor**, **Fisheries Tracker**, **Relationship Explorer** (the centrepiece: Pearson/Spearman, p-value, lags, scatter + regression, interpretation) and **Regional Insights**. A global filter bar (area: Mindanao/region/province, years, resolution, species, variable), **Methodology** and **Download CSV** are on every view. **All numbers are generated sample data** until the backend is connected. Out of scope: yield forecasting, import/export monitoring, food-security prediction.

## Commands

| Command | Use |
| --- | --- |
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run dev:clean` | Same, but clears the build cache first. Use this if styles look stale or broken |
| `npm run check` | Typecheck + lint + tests. **Must pass before you finish any change** |
| `npm run test` | Tests only (fast, under a second) |
| `npm run build` | Production build |

## Where things are

```
src/
  app/                  Next.js entry: layout.tsx (fonts), page.tsx, globals.css (ALL colours and theme)
    api/                Route handlers (serverless). Each parses its query, runs src/lib/analysis, returns JSON
      analysis/ ocean/ fisheries/ regional/   one per view      export/  same data as CSV
      _lib/handle.ts      shared parse -> run -> respond plumbing
  components/ui/        Generic pieces with no app knowledge: Block, Card, StatTile, Status, Segmented, icons
  features/
    dashboard/          Page shell and shared state
      Dashboard.tsx       header, filter bar, active view, modals
      useDashboardState.ts  ALL shared state and actions (view, area, years, resolution, species, lag...)
      views.ts            the five views: label, filters used, API dataset, query builder
      Header.tsx (nav + actions), OceanReadout.tsx, InsightsPanel.tsx, SpeciesPanel.tsx (Overview panels)
    overview/           OverviewView.tsx: the map layout (map, two panels, timeline)
    explorer/           Relationship Explorer      ocean/  Ocean Monitor      fisheries/  Fisheries Tracker
    regional/           Regional Insights          methodology/  the Methodology modal
    filters/            FilterBar and its controls (AreaSelect, YearRange, SpeciesSelect, SpeciesMulti)
    charts/             LineChart, ScatterPlot, BarList (responsive SVG/HTML, hover tooltips); axis.ts is pure
    map/                The circular map
      geometry.ts         projection, shapes, zoom maths (pure, tested)
      useMapView.ts       zoom / pan / tap handling
      OceanLens.tsx       assembles the map
      MapLayers.tsx       raster, grid, land     MapLabels.tsx  names, scale bar
      ProvinceMap.tsx     flat province choropleth (Ocean Monitor, Regional Insights)
      SpeciesRing.tsx     bubbles                ring.ts        bubble layout
    species/            Panel contents: KeyFinding, TrendChart, QuarterStat, CatchMix, SpeciesFilter, CorrelationCard
    history/            The history modal: HistoryModal.tsx assembles; rows.ts and csv.ts are pure and tested
    timeline/           Timeline.tsx (bottom dock)
    fish/               Dithered fish images: dither.ts (algorithm), DitheredFish.tsx, credits.ts
  lib/
    data/               THE DATA. index.ts is the only file UI code may import from
                          provinces.ts: 28 provinces + area helpers (an "area" is "all", a region id or a province id)
    analysis/           Pure maths behind the API: stats.ts (Pearson, Spearman, p-values, OLS), series.ts,
                          relationship.ts + interpret.ts, ocean.ts, fisheries.ts, regional.ts, csv.ts, params.ts
    useApi.ts           client hook that fetches /api/* (cached, keeps old data while loading)
    units.ts            names/units/formats for SST and chlorophyll-a
    field.ts            the coloured ocean layer      colors.ts  data colour scales
    format.ts           number formatting helpers
  data/                 JSON: map shapes, fish photo credits
public/fish/            Fish photos
```

Every file starts with a comment saying what it is for. Read that first.

## Rules

1. **Import data only from `@/lib/data`**, never from files inside `src/lib/data/`.
2. **Colours are CSS variables** in `src/app/globals.css` (`var(--warm)`, Tailwind `text-ink-2`, ...). Do not write hex codes in components. Colour *scales for data* live in `src/lib/colors.ts`.
3. **One component per file**, named like the file. Keep files under about 150 lines; split if larger.
4. **Shared state lives in `useDashboardState.ts`.** Components get values and callbacks as props. Local `useState` is only for things no other component needs (hover, open/closed).
5. **Files with hooks or event handlers start with `"use client";`.**
6. **Use the helpers**: `fmt`, `signed`, `trendColor` from `@/lib/format`; `Block` and `Segmented` from `@/components/ui`.
7. **Do not re-project the map per frame.** Shapes are computed once in `geometry.ts`; zoom/pan is one SVG transform. Things that must stay the same size on screen use `toScreen()`.
8. Use `memo` on components that do not depend on the current quarter or zoom, and `useMemo` for chart paths. The timeline re-renders the page ~2x per second while playing.
9. **Heavy computation runs in the API routes.** Views fetch with `useApi("/api/<x>", viewQuery(...))` and only draw. New analysis goes in `src/lib/analysis/` (pure, tested) plus a route in `src/app/api/`; validate query params in `params.ts`. UI may import *types* and small helpers from `@/lib/analysis`.

## How to...

**Add a species**
1. Add a row to `src/lib/data/species.ts` (`shares` = six numbers summing to 1, in region order).
2. Put a side-view photo in `public/fish/<id>.jpg` and add an entry to `src/data/fish-credits.json` with its source, licence and artist. If the fish faces right, add `"flip": true`.
3. Run `npm run test`. The "reference values" tests will fail because totals changed: update those numbers.

**Add a section to a side panel**
1. Create `src/features/species/MyThing.tsx` exporting one component.
2. Render it inside a `<Block title="...">` in `InsightsPanel.tsx` (left) or `SpeciesPanel.tsx` (right).

**Add a view**
1. Add an entry to `VIEWS` in `src/features/dashboard/views.ts` (filters, dataset) and its query in `viewQuery`.
2. Create `src/features/<name>/<Name>.tsx`, render it in `Dashboard.tsx`.

**Add an API endpoint**
1. Pure function in `src/lib/analysis/` (+ test), a parser in `params.ts`.
2. `src/app/api/<name>/route.ts`: `export const GET = jsonRoute(parseX, runX);`. Add a CSV builder to `csv.ts` and `export/route.ts` if it should be downloadable.

**Add shared state** (something two areas both need)
Add a `useState` and its setter to `useDashboardState.ts`, return them, pass them down from `Dashboard.tsx`.

**Change a colour or font**
Edit `src/app/globals.css` (colours) or `src/app/layout.tsx` (fonts). Then restart with `npm run dev:clean`.

**Connect the real backend**
Replace the generators in `src/lib/data/ocean.ts`, `landings.ts` and `stats.ts` with fetched data. Keep the exported names and shapes (`OCEAN[scope][quarter]`, `PROVINCE_OCEAN[provinceId][quarter]`, `YIELDS[scope][speciesId][quarter]`, `PROVINCE_YIELDS[provinceId][speciesId][quarter]`, `CORRELATION[scope][speciesId]`); the types are in `src/lib/data/types.ts`. Nothing in `features/` or `lib/analysis/` should need to change. Regions must stay the sum of their provinces. The ocean raster in `src/lib/field.ts` is separate: replace `sstAt`/`chlAt`.

## Gotchas

- **Stale styles after editing `globals.css`**: the dev server sometimes keeps old CSS. Run `npm run dev:clean`.
- **The dashboard renders in the browser only** (`ClientDashboard.tsx`, `ssr: false`), because it uses canvas. Code under `features/` can use `document`; code under `lib/` must not at import time (tests run in Node).
- **The time axis is observed quarters only** (Q1 2016 to Q3 2026). Annual views use complete years only (`COMPLETE_YEARS`, 2016-2025).
- **Concern flags and p-values are heuristics**: thresholds live in `src/lib/analysis/regional.ts`; the Methodology modal documents them. Keep the two in sync.
- **Headless Chrome screenshots below ~500px wide are cropped, not reflowed.** To check mobile layout, set the viewport with DevTools `Emulation.setDeviceMetricsOverride`.
- **Tests pin exact sample-data numbers** (`src/lib/data/data.test.ts`). If you change the generators on purpose, update the numbers in the same change. If you did not mean to change data and they fail, you broke something.
- **Sulu is in Region IX** in the map file (`src/data/mindanao.json`), following the PSA source, not in BARMM.
- **Fish photos need attribution.** Their licences require the credit shown by `FishCreditLine`. Do not remove it.
- **Tailwind arbitrary grid columns** like `grid-cols-[1fr_auto_44px]` did not generate reliably here; use `style={{ gridTemplateColumns: ... }}` as the existing code does.
