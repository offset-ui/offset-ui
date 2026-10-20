"use client";

import { Checklist } from "@/components/ui/checklist";

export default function ChecklistDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f2f2] p-6">
      <Checklist className="w-[240px]" />
    </main>
  );
}
