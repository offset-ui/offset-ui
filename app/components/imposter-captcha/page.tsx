"use client";

import { ImposterCaptcha } from "@/components/ui/imposter-captcha";

export default function ImposterCaptchaDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f0f0] p-6">
      <ImposterCaptcha scale={0.5} typography={{ title: 28, subtitle: 17, timer: 20, error: 17 }} />
    </main>
  );
}
