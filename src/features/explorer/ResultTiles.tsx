import { StatTile } from "@/components/ui/StatTile";
import { fmtP, type Stats } from "@/lib/analysis";
import { strengthLabel } from "@/lib/data";
import { corrTextColor, signed } from "@/lib/format";

const dash = "—";

/** The four headline numbers: Pearson, Spearman, p-value, observations. */
export function ResultTiles({ stats, unit }: { stats: Stats | null; unit: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Pearson r" value={stats ? signed(stats.pearson) : dash} tone={stats ? corrTextColor(stats.pearson) : undefined} sub={stats ? `${strengthLabel(stats.pearson)} · linear` : "Awaiting analysis"} />
      <StatTile label="Spearman rho" value={stats ? signed(stats.spearman) : dash} tone={stats ? corrTextColor(stats.spearman) : undefined} sub={stats ? `${strengthLabel(stats.spearman)} · rank-based` : "Awaiting analysis"} />
      <StatTile
        label="P-value"
        value={stats ? fmtP(stats.pPearson).replace("p ", "").replace("= ", "") : dash}
        sub={stats ? (stats.pPearson < 0.05 ? "Significant at 5%" : "Not significant at 5%") + ` · Spearman ${fmtP(stats.pSpearman)}` : "Two-sided t-test"}
      />
      <StatTile label="Observations" value={stats ? stats.n : dash} sub={stats ? `paired ${unit} · R² ${(stats.r2 * 100).toFixed(0)}%` : "Paired periods"} />
    </div>
  );
}
