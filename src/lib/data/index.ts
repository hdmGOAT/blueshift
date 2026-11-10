// THE DATA SEAM. UI code imports data only from "@/lib/data", never from the
// files next to this one.
//
// Everything here is deterministic SAMPLE data. To connect the real backend,
// replace the generators in ocean.ts, landings.ts and stats.ts with fetched
// values and keep these exported names and shapes. See AGENTS.md.
export * from "./types";
export * from "./time";
export * from "./regions";
export * from "./species";
export { OCEAN, oceanMean } from "./ocean";
export { YIELDS, scopeMax, annualTotal, catchMix, topSpecies } from "./landings";
export { CORRELATION, strengthLabel } from "./stats";
