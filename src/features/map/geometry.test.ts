import { describe, expect, it } from "vitest";
import { REGIONS } from "@/lib/data";
import { CX, CY, HOME, K_MAX, K_MIN, REGION_PATH, REGION_VIEW, clampView, lonLatAt, scaleBar, toBase, toScreen } from "./geometry";

describe("view transform", () => {
  it("round-trips between base and screen space", () => {
    const view = { x: 420, y: 380, k: 3.5 };
    const [sx, sy] = toScreen(view, 400, 300);
    const [bx, by] = toBase(view, sx, sy);
    expect(bx).toBeCloseTo(400, 9);
    expect(by).toBeCloseTo(300, 9);
  });

  it("puts the view centre at the lens centre", () => {
    const view = { x: 123, y: 456, k: 2 };
    expect(toScreen(view, 123, 456)).toEqual([CX, CY]);
  });

  it("centres the home view on Mindanao", () => {
    const [lon, lat] = lonLatAt(HOME, CX, CY);
    expect(lon).toBeGreaterThan(122);
    expect(lon).toBeLessThan(126);
    expect(lat).toBeGreaterThan(6);
    expect(lat).toBeLessThan(9);
  });
});

describe("clampView", () => {
  it("limits zoom", () => {
    expect(clampView({ ...HOME, k: 0.1 }).k).toBe(K_MIN);
    expect(clampView({ ...HOME, k: 99 }).k).toBe(K_MAX);
  });

  it("does not let the lens leave Mindanao", () => {
    const far = clampView({ x: -5000, y: 9000, k: 4 });
    const [lon, lat] = lonLatAt(far, CX, CY);
    expect(lon).toBeGreaterThan(118.5);
    expect(lon).toBeLessThan(127.5);
    expect(lat).toBeGreaterThan(4);
    expect(lat).toBeLessThan(11);
  });

  it("is stable when applied twice", () => {
    const once = clampView({ x: 10, y: 10, k: 2.5 });
    expect(clampView(once)).toEqual(once);
  });
});

describe("regions", () => {
  it("has a shape and a framing view for every region", () => {
    for (const r of REGIONS) {
      expect(REGION_PATH[r.id].length).toBeGreaterThan(100);
      expect(REGION_VIEW[r.id].k).toBeGreaterThan(1);
      expect(clampView(REGION_VIEW[r.id])).toEqual(REGION_VIEW[r.id]);
    }
  });
});

describe("scaleBar", () => {
  it("halves the distance when zoom doubles", () => {
    const a = scaleBar({ ...HOME, k: 1 });
    const b = scaleBar({ ...HOME, k: 2 });
    expect(a.km).toBe(100);
    expect(b.km).toBe(50);
    expect(b.px).toBeCloseTo(a.px, 6);
  });
});
