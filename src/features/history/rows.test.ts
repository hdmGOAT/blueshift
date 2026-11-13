import { describe, expect, it } from "vitest";
import { QUARTERS, SPECIES_BY_ID, YEARS } from "@/lib/data";
import { toCsv } from "./csv";
import { buildRows } from "./rows";

const galunggong = SPECIES_BY_ID.galunggong;

describe("buildRows", () => {
  it("returns one row per quarter or per year", () => {
    expect(buildRows(galunggong, "all", "q")).toHaveLength(QUARTERS.length);
    expect(buildRows(galunggong, "all", "y")).toHaveLength(YEARS.length);
  });

  it("makes annual totals equal the sum of their quarters", () => {
    const q = buildRows(galunggong, "ix", "q");
    const y = buildRows(galunggong, "ix", "y");
    expect(y[0].total).toBeCloseTo(q.slice(0, 4).reduce((a, r) => a + r.total, 0), 6);
  });

  it("flags only the incomplete year", () => {
    expect(buildRows(galunggong, "all", "q").filter((r) => r.partial)).toHaveLength(0);
    expect(buildRows(galunggong, "all", "y").filter((r) => r.partial).map((r) => r.label)).toEqual(["2026"]);
  });

  it("has no year-on-year change for the first year", () => {
    const q = buildRows(galunggong, "all", "q");
    expect(q[3].yoy).toBeNull();
    expect(q[4].yoy).not.toBeNull();
  });

  it("breaks All Mindanao down by region, and a region only by itself", () => {
    expect(Object.keys(buildRows(galunggong, "all", "q")[0].byRegion)).toHaveLength(6);
    expect(Object.keys(buildRows(galunggong, "xi", "q")[0].byRegion)).toEqual(["xi"]);
  });
});

describe("toCsv", () => {
  it("writes a header and one line per row", () => {
    const rows = buildRows(galunggong, "xi", "y");
    const lines = toCsv("xi", rows).split("\n");
    expect(lines[0]).toBe("period,landings_t,xi_t,sst_c,chl_mg_m3,partial_year");
    expect(lines).toHaveLength(rows.length + 1);
  });
});
