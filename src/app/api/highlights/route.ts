// GET /api/highlights?from=&to=
// The strongest ocean-fisheries relationships across every species, area,
// variable and lag (quarterly, seasonal cycle removed), with q-values.
import { findHighlights } from "@/lib/analysis/highlights";
import { parseYears } from "@/lib/analysis/params";
import { jsonRoute } from "../_lib/handle";

export const GET = jsonRoute(parseYears, (p) => findHighlights(p));
