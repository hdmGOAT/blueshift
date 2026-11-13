import { memo } from "react";
import { Card } from "@/components/ui/Card";
import type { Interpretation } from "@/lib/analysis";

const TONE: Record<Interpretation["level"], string> = {
  significant: "var(--accent-text)",
  marginal: "var(--ink)",
  none: "var(--ink-2)",
  insufficient: "var(--warm)",
};

/** Plain-language reading of the result, with its limitations. */
export const InterpretationCard = memo(function InterpretationCard({ interpretation: i }: { interpretation: Interpretation }) {
  return (
    <Card title="Statistical interpretation" sub="Generated from the numbers above, with the limitations that apply">
      <p className="text-[15px] font-medium leading-snug" style={{ color: TONE[i.level] }}>
        {i.headline}
      </p>
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2">
        {i.points.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="label mb-1.5 mt-4">Limitations</div>
      <ul className="list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-ink-3">
        {i.caveats.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </Card>
  );
});
