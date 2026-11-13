// GET /api/export?dataset=analysis|ocean|fisheries|regional&<that dataset's params>
// The same data as the matching JSON route, as a CSV download.
import { analysisCsv, fisheriesCsv, oceanCsv, regionalCsv } from "@/lib/analysis/csv";
import { fisheriesSummary } from "@/lib/analysis/fisheries";
import { oceanSummary } from "@/lib/analysis/ocean";
import { parseAnalysis, parseFisheries, parseOcean, parseRegional, type Parsed } from "@/lib/analysis/params";
import { regionalSummary } from "@/lib/analysis/regional";
import { runAnalysis } from "@/lib/analysis/relationship";
import { CACHE } from "../_lib/handle";

const DATASETS: Record<string, (q: URLSearchParams) => Parsed<string>> = {
  analysis: (q) => map(parseAnalysis(q), (p) => analysisCsv(runAnalysis(p))),
  ocean: (q) => map(parseOcean(q), (p) => oceanCsv(oceanSummary(p))),
  fisheries: (q) => map(parseFisheries(q), (p) => fisheriesCsv(fisheriesSummary(p))),
  regional: (q) => map(parseRegional(q), (p) => regionalCsv(regionalSummary(p))),
};

function map<P>(parsed: Parsed<P>, fn: (p: P) => string): Parsed<string> {
  return parsed.ok ? { ok: true, value: fn(parsed.value) } : parsed;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const dataset = q.get("dataset") ?? "";
  const build = DATASETS[dataset];
  if (!build) return Response.json({ error: `"dataset" must be one of: ${Object.keys(DATASETS).join(", ")}` }, { status: 400 });
  const csv = build(q);
  if (!csv.ok) return Response.json({ error: csv.error }, { status: 400 });
  const name = ["blueshift", dataset, q.get("area"), q.get("species")?.replace(/,/g, "+"), q.get("from"), q.get("to")].filter(Boolean).join("_");
  return new Response(csv.value, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": CACHE },
  });
}
