// GET /api/analysis?species=&area=&variable=sst|chl&resolution=quarterly|annual
//   &from=&to=&lag=&deseason=1&detrend=0
// Correlation, regression and interpretation for the Relationship Explorer.
import { parseAnalysis } from "@/lib/analysis/params";
import { runAnalysis } from "@/lib/analysis/relationship";
import { jsonRoute } from "../_lib/handle";

export const GET = jsonRoute(parseAnalysis, runAnalysis);
