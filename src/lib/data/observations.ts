// The observed data, generated from the CSV by `npm run data`
// (scripts/csv-to-json.mts -> src/data/observations.json). Do not edit the
// JSON by hand; rerun the script when the CSV changes.
import raw from "@/data/observations.json";

export type Observations = {
  meta: { source: string; firstYear: number; quarters: number; provinces: string[]; species: Record<string, string> };
  centroids: Record<string, [number, number]>;
  sst: Record<string, number[]>;
  chl: Record<string, number[]>;
  /** null = not recorded. */
  yields: Record<string, Record<string, (number | null)[]>>;
};

export const OBS = raw as unknown as Observations;
