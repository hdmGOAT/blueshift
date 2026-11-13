import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";

// Same pairing as NASA's Horizon Design System (nasa.gov): Inter + DM Mono.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "BlueShift · Earth system trend detective",
  description: "Explore how changing ocean conditions (NASA satellite SST and chlorophyll-a) relate to Philippine fisheries production (PSA) across Mindanao.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
