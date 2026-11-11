"use client";

import { IsometricKeyboard } from "@/components/ui/isometric-keyboard";

export default function IsometricKeyboardDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 p-8">
      {/* Active key turns blue. Move the mouse across it — the press trails the cursor. */}
      <div className="w-full max-w-[560px] rounded-2xl bg-[#fafaf9] p-6">
        <IsometricKeyboard theme="light" />
      </div>
    </main>
  );
}
