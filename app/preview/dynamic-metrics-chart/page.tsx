"use client";

import { Inter } from "next/font/google";
import { DynamicMetricsChart, type MetricsFrame } from "@/components/ui/dynamic-metrics-chart";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"] });

// "No data" showcase: frames with zero units render the empty state automatically.
// With real data you just pass live frames — this state appears on its own whenever a
// period has no data, and the Refresh button fires onRefresh so you can refetch.
const emptyFrames: MetricsFrame[] = [
  { id: "today", label: "Today", sales: 0, units: 0, salesChange: 0, unitsChange: 0, bars: [], ticks: ["00:00", "06:00", "12:00", "18:00", "24:00"] },
  { id: "7d", label: "7D", sales: 0, units: 0, salesChange: 0, unitsChange: 0, bars: [], ticks: ["02 Oct", "03 Oct", "04 Oct", "05 Oct", "06 Oct", "07 Oct", "08 Oct"] },
  { id: "30d", label: "30D", sales: 0, units: 0, salesChange: 0, unitsChange: 0, bars: [], ticks: ["02 Oct", "06 Oct", "10 Oct", "14 Oct", "18 Oct", "22 Oct", "26 Oct", "30 Oct"] },
];

export default function DynamicMetricsChartDemo() {
  const font = { fontFamily: inter.style.fontFamily };
  return (
    <main className="flex min-h-screen flex-wrap content-center items-center justify-center gap-10 bg-[#fafaf9] p-5">
      {/* Data state — reads every value from the component's own defaults */}
      <DynamicMetricsChart typography={font} />

      {/* Empty / no-data state — triggered by a frame with zero units */}
      <DynamicMetricsChart typography={font} frames={emptyFrames} defaultTimeframe="30d" onRefresh={() => {}} />
    </main>
  );
}
