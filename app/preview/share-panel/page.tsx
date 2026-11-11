"use client";

import { SharePanel } from "@/components/ui/share-panel";

export default function SharePanelDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf9] p-8">
      <SharePanel resolveAvatar={(_, index) => (index === 0 ? "/share-panel/avatar-default.png" : undefined)} />
    </main>
  );
}
