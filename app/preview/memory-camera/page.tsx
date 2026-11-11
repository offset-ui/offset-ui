import { Inter } from "next/font/google";
import { MemoryCamera } from "@/components/ui/memory-camera";

const inter = Inter({ subsets: ["latin"] });
const IMAGES = [1, 2, 3, 5].map((n) => `/memory-camera/memory-${n}.webp`);

export default function MemoryCameraDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f0f0] p-6">
      {/* The sample images already carry the stamp cut-out, so the mask is switched off. */}
      <MemoryCamera images={IMAGES} stampMask={false} typography={{ fontFamily: inter.style.fontFamily }} />
    </main>
  );
}
