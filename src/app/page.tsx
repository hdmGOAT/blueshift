import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import { defaultHighlight } from "@/lib/analysis/highlights";
import { YEARS } from "@/lib/data";

// The app opens on the most significant ocean-fisheries relationship in the
// data. The search runs here, on the server (at build time: the data is
// static), and only the winning selection is sent to the browser.
export default function Home() {
  return <ClientDashboard start={defaultHighlight(YEARS[0], YEARS[YEARS.length - 1])} />;
}
