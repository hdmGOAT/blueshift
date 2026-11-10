import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";

// Same pairing as NASA's Horizon Design System (nasa.gov): Inter + DM Mono.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "BlueShift · Mindanao",
  description: "Sea temperature, chlorophyll-a and fish landings across Mindanao.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
