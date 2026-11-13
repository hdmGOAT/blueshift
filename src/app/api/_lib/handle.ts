// Shared plumbing for the /api routes: parse + validate the query, run a pure
// function from src/lib/analysis, and reply with JSON (or a 400 with the reason).
import type { Parsed } from "@/lib/analysis/params";

/** Results are deterministic for a given query, so browsers and CDNs may cache them. */
export const CACHE = "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400";

export function jsonRoute<P, R>(parse: (q: URLSearchParams) => Parsed<P>, run: (p: P) => R) {
  return async function GET(request: Request) {
    const parsed = parse(new URL(request.url).searchParams);
    if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
    return Response.json(run(parsed.value), { headers: { "Cache-Control": CACHE } });
  };
}
