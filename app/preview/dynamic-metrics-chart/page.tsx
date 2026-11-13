"use client";

import { Inter } from "next/font/google";
import { DynamicMetricsChart, type MetricsFrame } from "@/components/ui/dynamic-metrics-chart";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"] });

const empty = (label: string, labels: string[]): MetricsFrame => ({ label, sales: 0, units: 0, salesChange: 0, unitsChange: 0, points: [], labels });

const EMPTY_FRAMES = [
  empty("Today", ["00:00", "06:00", "12:00", "18:00", "24:00"]),
  empty("7D", ["02 Oct", "03 Oct", "04 Oct", "05 Oct", "06 Oct", "07 Oct", "08 Oct"]),
  empty("30D", ["02 Oct", "06 Oct", "10 Oct", "14 Oct", "18 Oct", "22 Oct", "26 Oct", "30 Oct"]),
];

export default function DynamicMetricsChartDemo() {
  return (
    <main className={`${inter.className} flex min-h-screen flex-wrap content-center items-center justify-center gap-10 bg-[#fafaf9] p-5`}>
      <DynamicMetricsChart />
      <DynamicMetricsChart frames={EMPTY_FRAMES} timeframe="30D" onRefresh={() => {}} />
    </main>
  );
}
