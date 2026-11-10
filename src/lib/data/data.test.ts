// Guards the data seam. If you change the sample generators on purpose, the
// "reference values" test will fail: update the numbers in the same commit.
import { describe, expect, it } from "vitest";
import { CORRELATION, FORECAST_INDEX, OCEAN, QUARTERS, REGIONS, SCOPES, SPECIES, YIELDS, annualTotal, catchMix, topSpecies } from "@/lib/data";

describe("shape", () => {
  it("has a full series for every scope and species", () => {
    for (const scope of SCOPES) {
      expect(OCEAN[scope]).toHaveLength(QUARTERS.length);
      for (const s of SPECIES) expect(YIELDS[scope][s.id]).toHaveLength(QUARTERS.length);
    }
  });

  it("puts an uncertainty band on the forecast quarter only", () => {
    const series = YIELDS.all.galunggong;
    expect(series[FORECAST_INDEX].low).toBeLessThan(series[FORECAST_INDEX].value);
    expect(series[FORECAST_INDEX].high).toBeGreaterThan(series[FORECAST_INDEX].value);
    expect(series[0].low).toBeUndefined();
  });

  it("splits each species across regions with shares that sum to 1", () => {
    for (const s of SPECIES) {
      expect(s.shares).toHaveLength(REGIONS.length);
      expect(s.shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    }
  });
});

describe("invariants", () => {
  it("makes All Mindanao the sum of its regions", () => {
    for (const s of SPECIES)
      for (const { index } of QUARTERS) {
        const sum = REGIONS.reduce((a, r) => a + YIELDS[r.id][s.id][index].value, 0);
        expect(YIELDS.all[s.id][index].value).toBeCloseTo(sum, 6);
      }
  });

  it("keeps correlations inside [-1, 1]", () => {
    for (const scope of SCOPES)
      for (const s of SPECIES) {
        const { sst, chl } = CORRELATION[scope][s.id];
        expect(Math.abs(sst)).toBeLessThanOrEqual(1);
        expect(Math.abs(chl)).toBeLessThanOrEqual(1);
      }
  });

  it("returns a catch mix sorted largest first with shares summing to 1", () => {
    const mix = catchMix("xi", 42);
    expect(mix).toHaveLength(SPECIES.length);
    expect(mix.reduce((a, m) => a + m.share, 0)).toBeCloseTo(1, 6);
    for (let i = 1; i < mix.length; i++) expect(mix[i - 1].v).toBeGreaterThanOrEqual(mix[i].v);
  });
});

describe("reference values (sample data is deterministic)", () => {
  it("matches known numbers", () => {
    expect(YIELDS.all.galunggong[42].value).toBeCloseTo(13226.361, 2);
    expect(YIELDS.ix.galunggong[42].value).toBeCloseTo(4954.651, 2);
    expect(CORRELATION.all.galunggong.sst).toBeCloseTo(-0.859, 3);
    expect(CORRELATION.all.galunggong.chl).toBeCloseTo(0.54, 3);
    expect(OCEAN.all[42].sst).toBeCloseTo(29.497, 3);
    expect(OCEAN.xi[10].chl).toBeCloseTo(0.265, 3);
    expect(YIELDS.all.galunggong[43].high! - YIELDS.all.galunggong[43].value).toBeCloseTo(500, 6);
    expect(annualTotal("all", "galunggong", 2025)).toBeGreaterThan(0);
  });

  it("matches the grand total of all landings", () => {
    let sum = 0;
    for (const scope of SCOPES) for (const s of SPECIES) for (const p of YIELDS[scope][s.id]) sum += p.value;
    expect(sum).toBeCloseTo(8972962.083, 2);
  });

  it("ranks species per region", () => {
    expect(topSpecies("ix")).toEqual(["tamban", "galunggong", "bangus", "tulingan", "dilis", "alumahan", "matambaka", "tilapia", "tambakol", "bisugo"]);
    expect(catchMix("xi", 42)[0].s.id).toBe("bangus");
  });
});
