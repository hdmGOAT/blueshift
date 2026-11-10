# BlueShift

**Be An Earth System Trend Detective.** BlueShift compares NASA satellite ocean data (sea-surface temperature and chlorophyll-a) with Philippine Statistics Authority fisheries statistics, to show how changing ocean conditions relate to fish landings and what that could mean for food security. The first study area is Mindanao.

> **Prototype.** This is a UI mockup. All numbers are deterministic **sample data** generated in `src/lib/data.ts`, not real NASA or PSA figures.

## What's in the mockup

- A map of Mindanao colored by sea temperature or chlorophyll-a. Species bubbles around it are sized by landings and colored by their correlation with ocean conditions.
- Per-region data for Zamboanga Peninsula, Northern Mindanao, Davao, SOCCSKSARGEN, Caraga and BARMM. Click a region to select and frame it. Scroll to zoom, drag to pan.
- A quarterly timeline from 2016 to the Q4 2026 projection, with play-through.
- The regional catch mix, a selected-species trend with outlook, and correlation scores.
- A history modal for each species: region tabs, quarterly/annual views, stacked regional chart, data table and CSV export. Use ← → to step through species.
- Collapsible side panels, toggled with `[` and `]`.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, d3 (scale, shape, geo).

## Connecting real data

The UI reads everything through `src/lib/data.ts`. To wire in the FastAPI backend, replace the generated series with API responses that use the same shapes:

- `YIELDS[scope][speciesId]`: quarterly landings in tonnes. The Q4 2026 point carries `low` and `high` bounds.
- `OCEAN[scope]`: quarterly SST and chlorophyll-a values and anomalies.
- `CORRELATION[scope][speciesId]`: `{ sst, chl }` Pearson r.

Here `scope` is `"all"` or a region id (`ix`, `x`, `xi`, `xii`, `xiii`, `barmm`).

## Credits

- **Province boundaries:** [faeldon/philippines-json-maps](https://github.com/faeldon/philippines-json-maps) (MIT), simplified.
- **Fish images:** Wikimedia Commons, rendered dithered in the browser. Each image's author, license and source link are in [`src/data/fish-credits.json`](src/data/fish-credits.json) and shown in the app. Licenses are public domain, CC BY and CC BY-SA.
- **Fonts:** Inter and DM Mono (SIL OFL), the pairing used by NASA's Horizon Design System.
- **Ocean data (planned):** NASA OB.DAAC MODIS-Aqua. **Fisheries data (planned):** Philippine Statistics Authority.
