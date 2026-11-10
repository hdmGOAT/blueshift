// Number formatting shared by every panel and chart.

/** 13226.4 -> "13,226" */
export const fmt = (n: number) => Math.round(n).toLocaleString();

/** -0.859 -> "−0.86" (true minus sign, explicit plus). */
export const signed = (n: number, digits = 2) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}`;

/** CSS colour for a change: coral when negative, cerulean otherwise. */
export const trendColor = (n: number) => (n < 0 ? "var(--warm)" : "var(--accent-text)");

/** CSS colour for a correlation: neutral inside ±0.2. */
export const corrTextColor = (r: number) => (Math.abs(r) < 0.2 ? "var(--ink-2)" : trendColor(r));
