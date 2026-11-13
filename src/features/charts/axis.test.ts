import { describe, expect, it } from "vitest";
import { stepOf, tick, xTicks } from "./axis";

describe("tick", () => {
  it("uses as many decimals as the tick spacing needs", () => {
    expect(tick(29.5, 0.5)).toBe("29.5");
    expect(tick(29, 0.5)).toBe("29.0");
    expect(tick(0.25, 0.05)).toBe("0.25");
    expect(tick(20, 10)).toBe("20");
    expect(tick(12500, 2500)).toBe("12.5k");
    expect(stepOf([28, 28.5, 29])).toBe(0.5);
  });

  it("labels quarterly axes at each Q1", () => {
    expect(xTicks(["Q3 2019", "Q4 2019", "Q1 2020", "Q2 2020"], 600)).toEqual([2]);
  });
});
