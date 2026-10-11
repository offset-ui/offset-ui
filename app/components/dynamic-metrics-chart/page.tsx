"use client";

import { Inter } from "next/font/google";
import { DynamicMetricsChart } from "@/components/ui/dynamic-metrics-chart";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"] });

// Edit everything (data, colours, sizes, typography) in the component's
// DEMO_FRAMES / COLORS / SIZES / TYPO defaults — this page only supplies the font.
export default function DynamicMetricsChartDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-5">
      <DynamicMetricsChart typography={{ fontFamily: inter.style.fontFamily }} />
    </main>
  );
}
