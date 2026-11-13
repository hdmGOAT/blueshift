"use client";

// Explains the data sources and the statistical methods. Static content;
// loaded on demand (see Dashboard.tsx).
import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { BASELINE, COMPLETE_YEARS, DATA_NOTES, LAST_COMPLETE_YEAR, LAST_OBSERVED, PROVINCES, SPECIES, YEARS, quarterLabel } from "@/lib/data";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-t border-line pt-4 first:border-t-0 first:pt-0">
    <h3 className="label mb-2">{title}</h3>
    <div className="space-y-2 text-[13px] leading-relaxed text-ink-2">{children}</div>
  </section>
);

export default function MethodologyModal({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="method-title">
      <div className="absolute inset-0 bg-prussian/70 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-rise relative flex max-h-full w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-line-strong bg-modal shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="method-title" className="font-display text-[18px] font-medium">Methodology</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-hi hover:text-ink">
            <CloseIcon />
          </button>
        </div>
        <div className="scroll-thin space-y-5 overflow-y-auto px-5 py-5">
          <Section title="Data">
            <p><b className="text-ink">Source.</b> One table of quarterly observations per province and species: sea surface temperature (SST, °C) and chlorophyll-a (mg/m³) from NASA satellite observations (MODIS-Aqua, Ocean Biology DAAC), and volume of fisheries production in metric tons from the Philippine Statistics Authority (PSA). The app is built from it with <span className="mono text-[12px]">npm run data</span>.</p>
            <p><b className="text-ink">Coverage.</b> {PROVINCES.length} provinces, {quarterLabel(0)} to {quarterLabel(LAST_OBSERVED)}. 2002 (Q3–Q4 only) is left out; {YEARS[YEARS.length - 1]} has Q1–Q2 only, so annual figures use complete years ({COMPLETE_YEARS[0]}–{LAST_COMPLETE_YEAR}). Bukidnon, Cotabato, Agusan del Sur and Maguindanao del Sur are not in the data and show as grey.</p>
            <p><b className="text-ink">Species.</b> Each species is a PSA reporting category, some broader than one biological species: {SPECIES.map((s) => `${s.local} = ${s.psa}`).join("; ")}.</p>
            <p><b className="text-ink">Gaps.</b> A blank yield means not recorded, never zero. Gaps are left as gaps: charts break, analyses skip those periods and report how many, and nothing is filled in or estimated. A year counts for a species only if all four quarters are recorded.</p>
            <p><b className="text-ink">Regions and Mindanao.</b> Landings add up the recorded provincial values, so a province that starts or stops reporting changes the total. Ocean values are the plain average of the provinces.</p>
            <p><b className="text-ink">Map colours at sea</b> are interpolated from the province values (inverse-distance weighting). They show the observed numbers smoothly, not extra measurements.</p>
          </Section>
          <Section title="Known data issues">
            {DATA_NOTES.map((n) => (
              <p key={n.id}>{n.text}</p>
            ))}
          </Section>
          <Section title="Relationship Explorer">
            <p><b className="text-ink">Pearson r</b> measures how closely the two series follow a straight line. <b className="text-ink">Spearman ρ</b> correlates their ranks, so it captures any consistently rising or falling relationship and is less affected by extreme values. If the two disagree, check the scatterplot for outliers or curvature.</p>
            <p><b className="text-ink">P-value.</b> Two-sided t-test of r = 0 with n − 2 degrees of freedom. Consecutive quarters are not independent (autocorrelation), so these p-values are likely too optimistic. Treat p near 0.05 as weak evidence.</p>
            <p><b className="text-ink">Remove seasonal cycle</b> (quarterly only, needs two or more years). Ocean values become departures from that quarter&apos;s mean; landings become the percentage departure from that quarter&apos;s mean. This stops both series from correlating just because both follow the seasons.</p>
            <p><b className="text-ink">Remove long-term trend.</b> Subtracts a fitted straight line from each series, so two series that simply drift over the decade do not appear linked.</p>
            <p><b className="text-ink">Lag.</b> Pairs landings with ocean conditions 1–4 quarters (or 1–2 years) earlier, to test delayed effects such as recruitment. Each lag drops one pair. Trying many lags raises the chance of a false positive.</p>
            <p><b className="text-ink">Regression line.</b> Ordinary least squares of yield on the ocean variable. R² is the share of variation in yield that the line accounts for.</p>
          </Section>
          <Section title="Strongest relationships and the starting view">
            <p>The app opens on the most significant relationship in the data, and the Explorer lists the strongest ones. They come from a search of every species, area (Mindanao, regions, provinces), ocean variable and lag of 0–4 quarters, using the Explorer&apos;s default method: quarterly, seasonal cycle removed, no detrending. Only combinations with at least 40 paired quarters are ranked, and each keeps only its best lag. The starting view skips results affected by a known data issue.</p>
            <p>Running thousands of tests guarantees some chance findings, so each result also has a <b className="text-ink">q-value</b>: the p-value adjusted with the Benjamini–Hochberg false discovery rate across every test in the search. Being the strongest result does not make it causal. Check the scatterplot and try removing the long-term trend: a relationship that only holds while both series trend together is weaker evidence.</p>
          </Section>
          <Section title="Summaries">
            <p><b className="text-ink">Trends and changes</b> are measured on a fitted straight line through the seasonally adjusted series, so a single unusual first or last quarter does not dominate. Ocean trends are given per decade.</p>
            <p><b className="text-ink">Anomalies</b> in the Ocean Monitor and on the map are departures from the {BASELINE.from}–{BASELINE.to} mean for the same quarter.</p>
            <p><b className="text-ink">Potential areas of concern</b> are provinces where the ocean variable moved in the direction of concern (SST rising more than 0.15 °C per decade, or chlorophyll-a falling more than 0.04 mg/m³ per decade) and landings fell more than 10%, or where landings fell more than 20%. This is a prompt to look closer, not a diagnosis.</p>
          </Section>
          <Section title="What BlueShift does not do">
            <p>It does not forecast yields, monitor imports or exports, or predict food-security outcomes. Correlation does not establish cause: landings also depend on fishing effort, fleet changes, closed seasons, prices and reporting practice.</p>
          </Section>
          <Section title="API">
            <p className="mono text-[12px]">GET /api/analysis · /api/ocean · /api/fisheries · /api/regional · /api/export?dataset=…</p>
            <p>Every chart is drawn from these endpoints, and Download CSV returns the same data as the page. Blank cells in a download are unrecorded values.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
