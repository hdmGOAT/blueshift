// GET /api/fisheries?area=&species=a,b&resolution=&from=&to=
// Production totals, trends, rankings and comparisons for the Fisheries Tracker.
import { parseFisheries } from "@/lib/analysis/params";
import { fisheriesSummary } from "@/lib/analysis/fisheries";
import { jsonRoute } from "../_lib/handle";

export const GET = jsonRoute(parseFisheries, fisheriesSummary);
