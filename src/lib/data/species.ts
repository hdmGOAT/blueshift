// The species the app shows. Order = rank by recorded Mindanao landings,
// 2003-2026 (largest first). `psa` is the reporting category in the data file;
// some are groups rather than one biological species.
//
// Adding a species: add a row here, map its id to the CSV category in
// scripts/csv-to-json.mts and run `npm run data`, then add its photo to
// public/fish/ and an entry in src/data/fish-credits.json (see AGENTS.md).
import type { Species } from "./types";

export const SPECIES: Species[] = [
  { id: "tamban", local: "Tamban", english: "Bali sardinella", scientific: "Sardinella lemuru", psa: "Bali Sardinella", habitat: "Pelagic" },
  { id: "tambakol", local: "Tambakol", english: "Yellowfin tuna", scientific: "Thunnus albacares", psa: "Yellowfin Tuna", habitat: "Pelagic" },
  { id: "tulingan", local: "Tulingan", english: "Frigate tuna", scientific: "Auxis thazard", psa: "Frigate Tuna", habitat: "Pelagic" },
  { id: "galunggong", local: "Galunggong", english: "Round scad", scientific: "Decapterus spp.", psa: "Roundscad", habitat: "Pelagic" },
  { id: "bangus", local: "Bangus", english: "Milkfish", scientific: "Chanos chanos", psa: "Milkfish", habitat: "Aquaculture" },
  { id: "matambaka", local: "Matambaka", english: "Bigeye scad", scientific: "Selar crumenophthalmus", psa: "Big-Eyed Scad", habitat: "Pelagic" },
  { id: "tilapia", local: "Tilapia", english: "Nile tilapia", scientific: "Oreochromis niloticus", psa: "Tilapia", habitat: "Freshwater" },
  { id: "alumahan", local: "Alumahan", english: "Indian mackerel", scientific: "Rastrelliger kanagurta", psa: "Indian Mackerel", habitat: "Pelagic" },
  { id: "dilis", local: "Dilis", english: "Anchovies", scientific: "Stolephorus spp.", psa: "Anchovies", habitat: "Pelagic" },
  { id: "lapulapu", local: "Lapu-lapu", english: "Grouper", scientific: "Epinephelus spp.", psa: "Grouper", habitat: "Reef" },
  { id: "tanigue", local: "Tanigue", english: "Spanish mackerel", scientific: "Scomberomorus commerson", psa: "Spanish Mackerel", habitat: "Pelagic" },
  { id: "mayamaya", local: "Maya-maya", english: "Snapper", scientific: "Lutjanus spp.", psa: "Snapper", habitat: "Reef" },
  { id: "bisugo", local: "Bisugo", english: "Threadfin bream", scientific: "Nemipterus spp.", psa: "Threadfin Bream", habitat: "Reef" },
  { id: "dalagangbukid", local: "Dalagang bukid", english: "Fusilier", scientific: "Caesio spp.", psa: "Caesio", habitat: "Reef" },
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s])) as Record<string, Species>;
