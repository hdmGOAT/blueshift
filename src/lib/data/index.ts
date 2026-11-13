// THE DATA SEAM. UI code imports data only from "@/lib/data", never from the
// files next to this one.
//
// Observed data: NASA SST / chlorophyll-a and PSA landings per province and
// quarter, generated from the CSV by `npm run data` into src/data/observations.json
// (see observations.ts). Regions and Mindanao are derived from the provinces.
export * from "./types";
export * from "./time";
export * from "./regions";
export * from "./provinces";
export * from "./species";
export { OCEAN, PROVINCE_OCEAN, areaOcean, oceanMean } from "./ocean";
export { YIELDS, PROVINCE_YIELDS, areaYields, scopeMax, annualTotal, catchMix, topSpecies } from "./landings";
export { CORRELATION, strengthLabel } from "./stats";
export { DATA_NOTES, notesFor, type DataNote } from "./notes";
