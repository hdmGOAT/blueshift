// Shared axis helpers for the charts. Pure.

/**
 * Compact tick text with as many decimals as the tick spacing needs:
 * 12500 -> "12.5k"; 29.5 with step 0.5 -> "29.5"; 0.215 with step 0.05 -> "0.22".
 */
export function tick(n: number, step = 1) {
  const a = Math.abs(n);
  if (a >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (a >= 1000) return `${+(n / 1000).toFixed(1)}k`;
  const decimals = Math.max(0, Math.min(3, -Math.floor(Math.log10(step) + 1e-9)));
  return n.toFixed(decimals);
}

/** Spacing between consecutive ticks (1 when there is only one). */
export const stepOf = (ticks: number[]) => (ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1);

/**
 * Indexes of x labels to print. Quarterly labels ("Q1 2019") show the year at
 * each Q1; annual labels show every year, or every other one when crowded.
 */
export function xTicks(labels: string[], width: number) {
  const quarterly = labels[0]?.startsWith("Q");
  const idx = labels.map((l, i) => (quarterly ? (l.startsWith("Q1") ? i : -1) : i)).filter((i) => i >= 0);
  const room = Math.max(1, Math.floor(width / 46));
  const step = Math.ceil(idx.length / room);
  return idx.filter((_, k) => k % step === 0);
}

export const xTickText = (label: string) => (label.startsWith("Q") ? label.slice(3) : label);
