"use client";

import { Inter } from "next/font/google";
import { DynamicMetricsChart, type MetricsFrame } from "@/components/ui/dynamic-metrics-chart";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"] });

// Edit these values freely — each timeframe drives its own counters, bars and ticks.
const frames: MetricsFrame[] = [
  {
    id: "today",
    label: "Today",
    sales: 261.42,
    units: 10,
    salesChange: 21.4,
    unitsChange: -2.16,
    bars: [54, 90, 26, 120, 93, 54, 102, 26, 59, 83],
    ticks: ["00:00", "06:00", "12:00", "18:00", "24:00"],
  },
  {
    id: "7d",
    label: "7D",
    sales: 458.02,
    units: 28,
    salesChange: 21.4,
    unitsChange: -0.11,
    bars: [54, 90, 26, 126, 78, 59, 83, 26, 68],
    ticks: ["02 Oct", "03 Oct", "04 Oct", "05 Oct", "06 Oct", "07 Oct", "08 Oct"],
  },
  {
    id: "30d",
    label: "30D",
    sales: 1102.1,
    units: 52,
    salesChange: 21.4,
    unitsChange: 3.69,
    bars: [100, 43, 86, 19, 14, 69, 97, 28, 34, 81, 30, 10, 14, 108, 19, 16, 85, 19, 74, 21, 89, 19, 83, 21, 81],
    ticks: ["02 Oct", "06 Oct", "10 Oct", "14 Oct", "18 Oct", "22 Oct", "26 Oct", "30 Oct"],
  },
];

export default function DynamicMetricsChartDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-5">
      <DynamicMetricsChart
        title="Overview"
        frames={frames}
        typography={{
          fontFamily: inter.style.fontFamily,
          headingSize: 20,
          headingWeight: 500,
          valueSize: 24,
          valueWeight: 500,
          labelSize: 16,
          axisSize: 14,
          pillSize: 16,
          badgeSize: 10,
        }}
      />
    </main>
  );
}
