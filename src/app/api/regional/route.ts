// GET /api/regional?variable=sst|chl&species=a,b&from=&to=
// Province and region summaries with concern flags for Regional Insights.
import { parseRegional } from "@/lib/analysis/params";
import { regionalSummary } from "@/lib/analysis/regional";
import { jsonRoute } from "../_lib/handle";

export const GET = jsonRoute(parseRegional, regionalSummary);
