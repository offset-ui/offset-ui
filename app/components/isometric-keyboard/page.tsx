"use client";

import { IsometricKeyboard } from "@/components/ui/isometric-keyboard";

export default function IsometricKeyboardDemo() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-neutral-50 p-8">
      {/* Light: active key turns blue. Move the mouse across it — the press trails the cursor. */}
      <div className="w-full max-w-[560px] rounded-2xl bg-white p-6">
        <IsometricKeyboard theme="light" />
      </div>

      {/* Dark: active key turns white on black. */}
      <div className="w-full max-w-[560px] rounded-2xl bg-[#0b0c0d] p-6">
        <IsometricKeyboard theme="dark" />
      </div>
    </main>
  );
}
