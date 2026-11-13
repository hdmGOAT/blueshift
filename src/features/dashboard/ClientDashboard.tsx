"use client";

import dynamic from "next/dynamic";
import type { Highlight } from "@/lib/analysis";

// The dashboard draws to canvas and computes chart geometry in the browser,
// so it is rendered client-side only (no server HTML to mismatch).
// `start` (the strongest relationship) is computed on the server in page.tsx.
export const ClientDashboard = dynamic<{ start?: Highlight | null }>(() => import("./Dashboard").then((m) => m.Dashboard), {
  ssr: false,
  loading: () => <div className="grid h-screen place-items-center text-[12px] tracking-wide text-ink-3">Loading ocean data…</div>,
});
