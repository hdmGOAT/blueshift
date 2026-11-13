// Guards the data seam. If you change the sample generators on purpose, the
// "reference values" test will fail: update the numbers in the same commit.
import { describe, expect, it } from "vitest";
import { COMPLETE_YEARS, CORRELATION, OCEAN, PROVINCES, PROVINCE_OCEAN, QUARTERS, REGIONS, SCOPES, SPECIES, YIELDS, areaOcean, areaYields, annualTotal, catchMix, provincesOf, topSpecies } from "@/lib/data";

describe("shape", () => {
  it("has a full series for every scope and species", () => {
    for (const scope of SCOPES) {
      expect(OCEAN[scope]).toHaveLength(QUARTERS.length);
      for (const s of SPECIES) expect(YIELDS[scope][s.id]).toHaveLength(QUARTERS.length);
    }
  });

  it("covers observed quarters only, Q1 2016 to Q3 2026", () => {
    expect(QUARTERS).toHaveLength(43);
    expect(COMPLETE_YEARS).toEqual([2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
  });

  it("has a full series for every province", () => {
    for (const p of PROVINCES) {
      expect(areaOcean(p.id)).toHaveLength(QUARTERS.length);
      for (const s of SPECIES) expect(areaYields(p.id, s.id)).toHaveLength(QUARTERS.length);
    }
  });

  it("gives every region at least one province, with unique ids", () => {
    for (const r of REGIONS) expect(provincesOf(r.id).length).toBeGreaterThan(0);
    expect(new Set(PROVINCES.map((p) => p.id)).size).toBe(PROVINCES.length);
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

  it("makes each region the sum of its provinces", () => {
    for (const r of REGIONS)
      for (const s of SPECIES)
        for (const { index } of QUARTERS) {
          const sum = provincesOf(r.id).reduce((a, p) => a + areaYields(p.id, s.id)[index].value, 0);
          expect(sum).toBeCloseTo(YIELDS[r.id][s.id][index].value, 6);
        }
  });

  it("gives landlocked provinces their region's waters", () => {
    expect(PROVINCE_OCEAN.bukidnon).toBe(OCEAN.x);
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
    expect(annualTotal("all", "galunggong", 2025)).toBeGreaterThan(0);
    expect(areaYields("zamboanga-del-norte", "tamban")[42].value).toBeCloseTo(3607.741, 2);
    expect(areaOcean("davao-oriental")[10].sst).toBeCloseTo(29.305, 3);
  });

  it("matches the grand total of all landings", () => {
    let sum = 0;
    for (const scope of SCOPES) for (const s of SPECIES) for (const p of YIELDS[scope][s.id]) sum += p.value;
    expect(sum).toBeCloseTo(8780769.77, 2);
  });

  it("ranks species per region", () => {
    expect(topSpecies("ix")).toEqual(["tamban", "galunggong", "bangus", "tulingan", "dilis", "alumahan", "matambaka", "tilapia", "tambakol", "bisugo"]);
    expect(catchMix("xi", 42)[0].s.id).toBe("bangus");
  });
});
