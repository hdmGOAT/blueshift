// THE DATA SEAM. UI code imports data only from "@/lib/data", never from the
// files next to this one.
//
// Everything here is deterministic SAMPLE data. To connect the real backend,
// replace the generators in ocean.ts, landings.ts and stats.ts
// (analysis maths lives in src/lib/analysis and runs in the API routes) with fetched
// values and keep these exported names and shapes. See AGENTS.md.
export * from "./types";
export * from "./time";
export * from "./regions";
export * from "./provinces";
export * from "./species";
export { OCEAN, PROVINCE_OCEAN, areaOcean, oceanMean } from "./ocean";
export { YIELDS, PROVINCE_YIELDS, areaYields, scopeMax, annualTotal, catchMix, topSpecies } from "./landings";
export { CORRELATION, strengthLabel } from "./stats";
