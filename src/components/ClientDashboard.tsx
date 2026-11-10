"use client";

import dynamic from "next/dynamic";

// Charts and the satellite raster are computed in the browser, so skip SSR
// to avoid float/style hydration mismatches. Revisit once real data is fetched.
export const ClientDashboard = dynamic(() => import("./Dashboard").then((m) => m.Dashboard), {
  ssr: false,
  loading: () => (
    <div className="grid h-screen place-items-center text-[12px] tracking-wide text-ink-3">Loading ocean data…</div>
  ),
});
