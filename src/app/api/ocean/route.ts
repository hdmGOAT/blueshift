// GET /api/ocean?area=&variable=sst|chl&resolution=&from=&to=
// SST / chlorophyll-a series, stats and per-province means for the Ocean Monitor.
import { parseOcean } from "@/lib/analysis/params";
import { oceanSummary } from "@/lib/analysis/ocean";
import { jsonRoute } from "../_lib/handle";

export const GET = jsonRoute(parseOcean, oceanSummary);
