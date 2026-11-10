"use client";

import dynamic from "next/dynamic";

// The dashboard draws to canvas and computes chart geometry in the browser,
// so it is rendered client-side only (no server HTML to mismatch).
export const ClientDashboard = dynamic(() => import("./Dashboard").then((m) => m.Dashboard), {
  ssr: false,
  loading: () => <div className="grid h-screen place-items-center text-[12px] tracking-wide text-ink-3">Loading ocean data…</div>,
});
