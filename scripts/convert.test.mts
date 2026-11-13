import { describe, expect, it } from "vitest";
import { centroid, convert, parseCsv } from "./convert.mts";

const HEAD = "Year,Quarter,Province,Species,Chlorophyll-A Concentration (mg/m³),Sea Surface Temperature (°C),Yield (Metric Tons)";
const opts = { species: { tamban: "Bali Sardinella" }, centroids: { Sulu: [121, 6] as [number, number] }, source: "test.csv" };

describe("parseCsv", () => {
  it("handles BOM, quotes, escaped quotes and CRLF", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
  });
});

describe("convert", () => {
  const csv = [HEAD, "2003,Q1,Sulu,Bali Sardinella,0.5,29.1,10", "2003,Q1,Sulu,Seaweed,0.5,29.1,999", "2003,Q2,Sulu,Bali Sardinella,0.4,29.9,"].join("\n");

  it("keeps mapped species, one ocean value per province-quarter, and blanks as null", () => {
    const { data, report } = convert(parseCsv(csv), opts);
    expect(data.meta).toMatchObject({ firstYear: 2003, quarters: 2, provinces: ["Sulu"] });
    expect(data.yields.Sulu.tamban).toEqual([10, null]);
    expect(data.sst.Sulu).toEqual([29.1, 29.9]);
    expect(report).toMatchObject({ rowsUsed: 2, missingYields: { tamban: 1 } });
  });

  it("drops rows before fromYear and indexes from Q1 of it", () => {
    const { data } = convert(parseCsv([HEAD, "2002,Q4,Sulu,Bali Sardinella,0.5,29,1", "2003,Q1,Sulu,Bali Sardinella,0.5,29,2"].join("\n")), { ...opts, fromYear: 2003 });
    expect(data.yields.Sulu.tamban).toEqual([2]);
  });

  it("rejects bad input with a line number", () => {
    expect(() => convert(parseCsv([HEAD, "2003,Q1,Sulu,Bali Sardinella,0.5,warm,1"].join("\n")), opts)).toThrow(/Line 2: SST "warm"/);
    expect(() => convert(parseCsv([HEAD, "2003,Q1,Sulu,Bali Sardinella,0.5,29,-4"].join("\n")), opts)).toThrow(/negative/);
    expect(() => convert(parseCsv("Year,Quarter\n2003,Q1"), opts)).toThrow(/Missing column/);
    expect(() => convert(parseCsv([HEAD, "2003,Q1,Sulu,Seaweed,0.5,29,1"].join("\n")), opts)).toThrow(/not found in the CSV: Bali Sardinella/);
    expect(() => convert(parseCsv([HEAD, "2003,Q1,Basilan,Bali Sardinella,0.5,29,1"].join("\n")), opts)).toThrow(/No map shape for: Basilan/);
  });
});

describe("centroid", () => {
  it("finds the centre of the largest polygon", () => {
    const square = (x: number, s: number) => [[[x, 0], [x + s, 0], [x + s, s], [x, s], [x, 0]]];
    expect(centroid({ type: "MultiPolygon", coordinates: [square(0, 1), square(10, 4)] })).toEqual([12, 2]);
  });
});
