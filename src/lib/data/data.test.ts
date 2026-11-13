// Guards the data seam. Reference values are copied from the raw CSV
// (data/raw/blueshift_dataset.csv), so these tests check the whole path
// CSV -> npm run data -> observations.json -> lib/data. If the CSV changes on
// purpose, rerun `npm run data` and update the numbers in the same commit.
import { describe, expect, it } from "vitest";
import {
  COMPLETE_YEARS, CORRELATION, OCEAN, PROVINCES, QUARTERS, REGIONS, SCOPES, SPECIES, YIELDS,
  areaOcean, areaYields, catchMix, notesFor, provincesOf, topSpecies,
} from "@/lib/data";

const at = (year: number, q: number) => QUARTERS.findIndex((x) => x.year === year && x.q === q);

describe("shape", () => {
  it("covers Q1 2003 to Q2 2026 with Q1 at index 0", () => {
    expect(QUARTERS).toHaveLength(94);
    expect(QUARTERS[0]).toEqual({ index: 0, year: 2003, q: 1 });
    expect(QUARTERS.at(-1)).toMatchObject({ year: 2026, q: 2 });
    expect(COMPLETE_YEARS[0]).toBe(2003);
    expect(COMPLETE_YEARS.at(-1)).toBe(2025);
  });

  it("has 24 provinces, each in a region, with a full series per species", () => {
    expect(PROVINCES).toHaveLength(24);
    for (const r of REGIONS) expect(provincesOf(r.id).length).toBeGreaterThan(0);
    for (const p of PROVINCES) {
      expect(areaOcean(p.id)).toHaveLength(QUARTERS.length);
      for (const s of SPECIES) expect(areaYields(p.id, s.id)).toHaveLength(QUARTERS.length);
    }
    expect(PROVINCES.map((p) => p.name)).not.toContain("Bukidnon");
  });

  it("has a full series for every scope", () => {
    for (const scope of SCOPES) {
      expect(OCEAN[scope]).toHaveLength(QUARTERS.length);
      for (const s of SPECIES) expect(YIELDS[scope][s.id]).toHaveLength(QUARTERS.length);
    }
  });
});

describe("reference values from the CSV", () => {
  it("matches recorded yields, ocean values, and blanks", () => {
    expect(areaYields("zamboanga-del-norte", "galunggong")[at(2010, 2)].value).toBe(879.43);
    expect(areaYields("davao-oriental", "tambakol")[at(2024, 3)].value).toBe(1530.74);
    expect(areaYields("south-cotabato", "tambakol")[at(2026, 2)].value).toBe(6112.46);
    expect(areaYields("sulu", "tilapia")[at(2003, 1)].value).toBeNull();
    expect(areaYields("davao-occidental", "bangus")[at(2018, 4)].value).toBeNull();
    expect(areaOcean("zamboanga-del-norte")[at(2010, 2)].sst).toBeCloseTo(29.306, 3);
    expect(areaOcean("zamboanga-del-norte")[at(2010, 2)].chl).toBeCloseTo(0.9489, 4);
    expect(areaOcean("davao-oriental")[at(2024, 3)].sst).toBeCloseTo(30.764, 3);
  });
});

describe("invariants", () => {
  it("makes each region the sum of its provinces' recorded values, and Mindanao the sum of regions", () => {
    for (const s of SPECIES)
      for (const { index } of QUARTERS) {
        let mindanao = 0;
        for (const r of REGIONS) {
          const sum = provincesOf(r.id).reduce((a, p) => a + (areaYields(p.id, s.id)[index].value ?? 0), 0);
          expect(YIELDS[r.id][s.id][index].value).toBeCloseTo(sum, 6);
          mindanao += sum;
        }
        expect(YIELDS.all[s.id][index].value).toBeCloseTo(mindanao, 6);
      }
  });

  it("averages province ocean values for regions", () => {
    const ps = provincesOf("xi");
    const i = at(2015, 3);
    expect(OCEAN.xi[i].sst).toBeCloseTo(ps.reduce((a, p) => a + areaOcean(p.id)[i].sst, 0) / ps.length, 9);
  });

  it("measures anomalies against the same quarter's baseline (they average ~0 over 2003-2012)", () => {
    const base = OCEAN.all.slice(0, 40);
    for (let q = 0; q < 4; q++) expect(base.filter((o) => o.index % 4 === q).reduce((a, o) => a + o.sstAnom, 0) / 10).toBeCloseTo(0, 9);
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
    expect(topSpecies("all")).toHaveLength(10);
  });

  it("raises data notes only where they apply", () => {
    expect(notesFor("zamboanga-del-sur", 2022, 2022).map((n) => n.id)).toEqual(["zds-2022"]);
    expect(notesFor("zamboanga-del-sur", 2010, 2020)).toEqual([]);
    expect(notesFor("all", 2003, 2026).map((n) => n.id).sort()).toEqual(["davocc-2019", "zds-2022"]);
    expect(notesFor("xiii", 2003, 2026)).toEqual([]);
    expect(notesFor("not-a-place", 2003, 2026)).toEqual([]);
  });
});
