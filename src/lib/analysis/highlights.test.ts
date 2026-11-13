import { describe, expect, it } from "vitest";
import { bhQ, defaultHighlight, findHighlights, MIN_N } from "./highlights";
import { parseYears } from "./params";
import { runAnalysis } from "./relationship";

describe("bhQ", () => {
  it("matches the Benjamini-Hochberg procedure", () => {
    // p sorted: 0.01, 0.02, 0.03, 0.5 (m = 4) -> 0.04, 0.04, 0.04, 0.5
    expect(bhQ([0.03, 0.5, 0.01, 0.02]).map((q) => +q.toFixed(4))).toEqual([0.04, 0.5, 0.04, 0.04]);
  });
});

describe("findHighlights", () => {
  const h = findHighlights({ from: 2003, to: 2026 });

  it("ranks by p-value, one entry per species, area and variable, well-covered only", () => {
    expect(new Set(h.top.map((t) => `${t.params.species}|${t.params.area}|${t.params.variable}`)).size).toBe(h.top.length);
    expect(h.tests).toBeGreaterThan(1000);
    for (let i = 1; i < h.top.length; i++) expect(h.top[i].p).toBeGreaterThanOrEqual(h.top[i - 1].p);
    for (const t of h.top) expect(t.n).toBeGreaterThanOrEqual(MIN_N);
  });

  it("reproduces exactly in the Explorer", () => {
    const t = h.top[0];
    const a = runAnalysis(t.params);
    expect(a.stats!.pearson).toBeCloseTo(t.r, 12);
    expect(a.stats!.spearman).toBeCloseTo(t.rho, 12);
    expect(a.stats!.n).toBe(t.n);
  });

  it("defaults to the strongest result without a data-quality flag", () => {
    const d = defaultHighlight(2003, 2026)!;
    expect(d.flagged).toBe(false);
    expect(h.top.filter((t) => !t.flagged)[0]).toEqual(d);
  });

  it("prints the top results", () => {
    console.log(`tests ${h.tests}, significant at q<0.05: ${h.significant}`);
    for (const t of h.top) console.log(`${t.speciesName.padEnd(14)} ${t.areaName.padEnd(22)} ${t.params.variable} lag${t.params.lag} r=${t.r.toFixed(2)} rho=${t.rho.toFixed(2)} p=${t.p.toExponential(1)} q=${t.q.toExponential(1)} n=${t.n}${t.flagged ? " FLAG" : ""}`);
  });
});

describe("parseYears", () => {
  it("parses a year range", () => {
    expect(parseYears(new URLSearchParams("from=2010&to=2020"))).toEqual({ ok: true, value: { from: 2010, to: 2020 } });
  });
});
