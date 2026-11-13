// Guards the statistics and the summaries served by /api.
import { describe, expect, it } from "vitest";
import { areaYields, PROVINCES, SPECIES } from "@/lib/data";
import { analysisCsv } from "./csv";
import { fisheriesSummary } from "./fisheries";
import { oceanSummary } from "./ocean";
import { parseAnalysis, parseFisheries, toQuery, type AnalysisParams } from "./params";
import { regionalSummary } from "./regional";
import { runAnalysis } from "./relationship";
import { deseason, periods, yieldSeries } from "./series";
import { correlationP, detrend, linreg, pearson, ranks, spearman } from "./stats";

describe("stats", () => {
  it("computes Pearson and Spearman", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 12);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 12);
    // Monotonic but not linear: Spearman is exactly 1, Pearson is below it.
    const x = [1, 2, 3, 4, 5];
    const y = x.map((v) => v ** 4);
    expect(spearman(x, y)).toBeCloseTo(1, 12);
    expect(pearson(x, y)).toBeLessThan(0.99);
  });

  it("averages tied ranks", () => {
    expect(ranks([10, 20, 20, 30])).toEqual([1, 2.5, 2.5, 4]);
  });

  it("matches reference p-values for r", () => {
    // r = 0.5, n = 20 -> t = 2.449, df = 18 -> two-sided p = 0.0248
    expect(correlationP(0.5, 20)).toBeCloseTo(0.0248, 4);
    // r = 0.3, n = 43 -> p = 0.0506
    expect(correlationP(0.3, 43)).toBeCloseTo(0.0506, 3);
    expect(correlationP(0, 30)).toBeCloseTo(1, 10);
    expect(correlationP(0.999, 30)).toBeLessThan(1e-10);
  });

  it("fits and removes straight lines", () => {
    expect(linreg([0, 1, 2], [1, 3, 5])).toEqual({ slope: 2, intercept: 1 });
    for (const v of detrend([1, 3, 5, 7])) expect(v).toBeCloseTo(0, 12);
  });
});

describe("series", () => {
  it("builds annual periods from complete years only", () => {
    expect(periods("annual", 2024, 2026).map((p) => p.label)).toEqual(["2024", "2025"]);
    expect(periods("quarterly", 2026, 2026)).toHaveLength(3);
  });

  it("sums landings over the chosen species", () => {
    const per = periods("annual", 2020, 2020);
    const both = yieldSeries("xi", ["bangus", "tamban"], per)[0];
    expect(both).toBeCloseTo(yieldSeries("xi", ["bangus"], per)[0] + yieldSeries("xi", ["tamban"], per)[0], 6);
  });

  it("removes the seasonal cycle", () => {
    const per = periods("quarterly", 2016, 2017);
    const flat = deseason([1, 2, 3, 4, 1, 2, 3, 4], per, "diff");
    for (const v of flat) expect(v).toBeCloseTo(0, 12);
  });
});

const BASE: AnalysisParams = { area: "all", species: "galunggong", variable: "sst", resolution: "quarterly", from: 2016, to: 2026, lag: 0, deseason: true, detrend: false };

describe("runAnalysis", () => {
  it("finds the built-in negative SST link for round scad", () => {
    const a = runAnalysis(BASE);
    expect(a.stats!.n).toBe(43);
    expect(a.stats!.pearson).toBeLessThan(-0.4);
    expect(a.stats!.pPearson).toBeLessThan(0.05);
    expect(a.interpretation.level).toBe("significant");
    expect(a.interpretation.headline).toMatch(/negative/);
  });

  it("loses one pair per period of lag", () => {
    expect(runAnalysis({ ...BASE, lag: 2 }).stats!.n).toBe(41);
    expect(runAnalysis(BASE).lagProfile).toHaveLength(5);
  });

  it("does not deseason a single year, and says so", () => {
    const a = runAnalysis({ ...BASE, from: 2020, to: 2020 });
    expect(a.applied.deseason).toBe(false);
    expect(a.stats).toBeNull(); // 4 quarters < MIN_PAIRS
    expect(a.interpretation.level).toBe("insufficient");
    expect(a.interpretation.caveats.join(" ")).toMatch(/two years/);
  });

  it("works for every province", () => {
    for (const p of PROVINCES) expect(runAnalysis({ ...BASE, area: p.id }).stats).not.toBeNull();
  });

  it("flags landlocked provinces in the caveats", () => {
    expect(runAnalysis({ ...BASE, area: "bukidnon" }).interpretation.caveats.join(" ")).toMatch(/no coastline/);
  });

  it("exports the pairs as CSV", () => {
    const csv = analysisCsv(runAnalysis({ ...BASE, resolution: "annual", deseason: false }));
    expect(csv).toMatch(/^# dataset: Ocean-fisheries relationship/);
    expect(csv.trim().split("\n").filter((l) => !l.startsWith("#"))).toHaveLength(11); // header + 10 years
  });
});

describe("params", () => {
  it("round-trips through a query string", () => {
    const parsed = parseAnalysis(new URLSearchParams(toQuery(BASE)));
    expect(parsed).toEqual({ ok: true, value: BASE });
  });

  it("rejects bad input with a reason", () => {
    expect(parseAnalysis(new URLSearchParams("area=atlantis"))).toEqual({ ok: false, error: 'Unknown area "atlantis"' });
    expect(parseAnalysis(new URLSearchParams("resolution=annual&lag=3")).ok).toBe(false);
    expect(parseFisheries(new URLSearchParams("from=2022&to=2018")).ok).toBe(false);
    expect(parseFisheries(new URLSearchParams("resolution=annual&from=2026&to=2026")).ok).toBe(false);
  });
});

describe("summaries", () => {
  it("ocean: stats bracket the mean and cover every province", () => {
    const o = oceanSummary({ area: "xi", variable: "sst", resolution: "quarterly", from: 2016, to: 2026 });
    expect(o.stats.min).toBeLessThanOrEqual(o.stats.mean);
    expect(o.stats.max).toBeGreaterThanOrEqual(o.stats.mean);
    expect(o.provinces).toHaveLength(PROVINCES.length);
    expect(o.years.at(-1)).toMatchObject({ year: 2026, partial: true });
  });

  it("fisheries: totals agree across breakdowns", () => {
    const f = fisheriesSummary({ area: "ix", species: [], resolution: "annual", from: 2020, to: 2024 });
    const byRank = f.ranking.reduce((a, r) => a + r.total, 0);
    const byProvince = f.provinces.reduce((a, r) => a + r.total, 0);
    expect(byRank).toBeCloseTo(f.total, 3);
    expect(byProvince).toBeCloseTo(f.total, 3);
    expect(f.ranking).toHaveLength(SPECIES.length);
  });

  it("fisheries: a province is compared with its region's other provinces", () => {
    const f = fisheriesSummary({ area: "sarangani", species: ["tambakol"], resolution: "quarterly", from: 2016, to: 2026 });
    expect(f.provinces.map((p) => p.id)).toContain("south-cotabato");
    expect(f.provinces.find((p) => p.selected)!.id).toBe("sarangani");
    expect(f.total).toBeCloseTo(areaYields("sarangani", "tambakol").reduce((a, p) => a + p.value, 0), 3);
  });

  it("regional: one row per province and region", () => {
    const r = regionalSummary({ from: 2016, to: 2026, variable: "sst", species: [] });
    expect(r.provinces).toHaveLength(PROVINCES.length);
    expect(r.regions).toHaveLength(6);
  });
});
