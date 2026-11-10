// The species list. Order = rank by Mindanao-wide catch (largest first).
// `shares` is the split across regions in REGIONS order: IX, X, XI, XII, XIII, BARMM.
//
// Adding a species: add a row here, then add its photo to public/fish/ and an
// entry in src/data/fish-credits.json (see AGENTS.md, "Add a species").
import type { Species } from "./types";

export const SPECIES: Species[] = [
  { id: "tamban", local: "Tamban", english: "Sardines", scientific: "Sardinella spp.", habitat: "Pelagic", base: 21800, shares: [0.6, 0.08, 0.04, 0.05, 0.03, 0.2], sstSens: -0.42, chlSens: 0.3, trend: -0.022 },
  { id: "galunggong", local: "Galunggong", english: "Round scad", scientific: "Decapterus spp.", habitat: "Pelagic", base: 17600, shares: [0.38, 0.1, 0.06, 0.08, 0.06, 0.32], sstSens: -0.31, chlSens: 0.22, trend: -0.016 },
  { id: "tulingan", local: "Tulingan", english: "Frigate & bullet tuna", scientific: "Auxis spp.", habitat: "Pelagic", base: 13900, shares: [0.18, 0.12, 0.14, 0.3, 0.08, 0.18], sstSens: -0.12, chlSens: 0.08, trend: -0.004 },
  { id: "bangus", local: "Bangus", english: "Milkfish", scientific: "Chanos chanos", habitat: "Aquaculture", base: 12300, shares: [0.22, 0.2, 0.14, 0.12, 0.24, 0.08], sstSens: 0.04, chlSens: 0.02, trend: 0.018 },
  { id: "tambakol", local: "Tambakol", english: "Yellowfin tuna", scientific: "Thunnus albacares", habitat: "Pelagic", base: 10400, shares: [0.05, 0.04, 0.16, 0.62, 0.05, 0.08], sstSens: 0.14, chlSens: -0.05, trend: 0.006 },
  { id: "tilapia", local: "Tilapia", english: "Nile tilapia", scientific: "Oreochromis niloticus", habitat: "Freshwater", base: 9100, shares: [0.06, 0.22, 0.1, 0.3, 0.1, 0.22], sstSens: -0.05, chlSens: 0.0, trend: 0.012 },
  { id: "dilis", local: "Dilis", english: "Anchovy", scientific: "Stolephorus spp.", habitat: "Pelagic", base: 6200, shares: [0.24, 0.3, 0.08, 0.06, 0.2, 0.12], sstSens: -0.36, chlSens: 0.38, trend: -0.019 },
  { id: "matambaka", local: "Matambaka", english: "Bigeye scad", scientific: "Selar crumenophthalmus", habitat: "Pelagic", base: 4900, shares: [0.2, 0.26, 0.1, 0.1, 0.18, 0.16], sstSens: -0.22, chlSens: 0.16, trend: -0.008 },
  { id: "alumahan", local: "Alumahan", english: "Indian mackerel", scientific: "Rastrelliger kanagurta", habitat: "Pelagic", base: 4100, shares: [0.26, 0.12, 0.12, 0.16, 0.1, 0.24], sstSens: -0.27, chlSens: 0.2, trend: -0.011 },
  { id: "dalagangbukid", local: "Dalagang bukid", english: "Yellowtail fusilier", scientific: "Pterocaesio chrysozona", habitat: "Reef", base: 2600, shares: [0.14, 0.1, 0.3, 0.12, 0.16, 0.18], sstSens: -0.33, chlSens: 0.06, trend: -0.014 },
  { id: "bisugo", local: "Bisugo", english: "Threadfin bream", scientific: "Nemipterus spp.", habitat: "Reef", base: 2200, shares: [0.2, 0.14, 0.24, 0.14, 0.14, 0.14], sstSens: -0.1, chlSens: 0.1, trend: -0.003 },
  { id: "tanigue", local: "Tanigue", english: "Spanish mackerel", scientific: "Scomberomorus commerson", habitat: "Pelagic", base: 1800, shares: [0.12, 0.1, 0.2, 0.14, 0.3, 0.14], sstSens: 0.09, chlSens: 0.04, trend: 0.003 },
  { id: "mayamaya", local: "Maya-maya", english: "Red snapper", scientific: "Lutjanus spp.", habitat: "Reef", base: 1500, shares: [0.16, 0.1, 0.26, 0.14, 0.16, 0.18], sstSens: -0.24, chlSens: 0.05, trend: -0.009 },
  { id: "lapulapu", local: "Lapu-lapu", english: "Grouper", scientific: "Epinephelus spp.", habitat: "Reef", base: 1200, shares: [0.18, 0.08, 0.14, 0.12, 0.16, 0.32], sstSens: -0.29, chlSens: 0.04, trend: -0.012 },
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s])) as Record<string, Species>;
