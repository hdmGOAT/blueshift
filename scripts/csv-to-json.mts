// Converts the observations CSV into src/data/observations.json, the file the
// app loads. Run after the CSV changes:
//
//   npm run data                         (reads data/raw/blueshift_dataset.csv)
//   npm run data -- path/to/other.csv    (any CSV with the same columns)
//
// Keeps only the species the app shows (SPECIES_MAP below), drops the partial
// first year (2002: Q3-Q4 only), checks every value, and prints a summary.
// Logic lives in scripts/convert.mts (tested); this file only does I/O.
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { centroid, convert, parseCsv } from "./convert.mts";

/** App species id (src/lib/data/species.ts) -> category name in the CSV (PSA reporting names). */
const SPECIES_MAP: Record<string, string> = {
  tamban: "Bali Sardinella",
  tambakol: "Yellowfin Tuna",
  tulingan: "Frigate Tuna",
  galunggong: "Roundscad",
  bangus: "Milkfish",
  matambaka: "Big-Eyed Scad",
  tilapia: "Tilapia",
  alumahan: "Indian Mackerel",
  dilis: "Anchovies",
  lapulapu: "Grouper",
  tanigue: "Spanish Mackerel",
  mayamaya: "Snapper",
  bisugo: "Threadfin Bream",
  dalagangbukid: "Caesio",
};

const FROM_YEAR = 2003;
const input = process.argv[2] ?? "data/raw/blueshift_dataset.csv";
const output = "src/data/observations.json";

const map = JSON.parse(readFileSync("src/data/mindanao.json", "utf8")) as { features: { properties: { name: string }; geometry: Parameters<typeof centroid>[0] }[] };
const centroids = Object.fromEntries(map.features.map((f) => [f.properties.name, centroid(f.geometry)]));

const { data, report } = convert(parseCsv(readFileSync(input, "utf8")), { species: SPECIES_MAP, fromYear: FROM_YEAR, centroids, source: basename(input) });
writeFileSync(output, JSON.stringify(data) + "\n");

const cells = data.meta.provinces.length * data.meta.quarters;
const last = data.meta.quarters - 1;
console.log(`Wrote ${output} (${(JSON.stringify(data).length / 1024).toFixed(0)} KB)`);
console.log(`  ${report.rows} CSV rows, ${report.rowsUsed} kept (${Object.keys(SPECIES_MAP).length} species), ${report.skippedBeforeStart} before ${FROM_YEAR} dropped`);
console.log(`  ${data.meta.provinces.length} provinces, Q1 ${data.meta.firstYear} to Q${(last % 4) + 1} ${data.meta.firstYear + Math.floor(last / 4)} (${data.meta.quarters} quarters)`);
console.log("  Missing yields (not recorded) per species:");
for (const [id, m] of Object.entries(report.missingYields)) console.log(`    ${id.padEnd(14)} ${String(m).padStart(4)} of ${cells} (${((100 * m) / cells).toFixed(1)}%)`);
