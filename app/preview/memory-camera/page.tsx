"use client";

import { MemoryCamera } from "@/components/ui/memory-camera";

const IMAGES = [1, 2, 3, 5].map((n) => `/memory-camera/memory-${n}.png`);

export default function MemoryCameraDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f0f0] p-6">
      {/* The sample images already carry the stamp cut-out, so the mask is switched off. */}
      <MemoryCamera images={IMAGES} stampMask={false} />
    </main>
  );
}
