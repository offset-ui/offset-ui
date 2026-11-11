import { Inter } from "next/font/google";
import { ImposterCaptcha } from "@/components/ui/imposter-captcha";

const inter = Inter({ subsets: ["latin"] });

export default function ImposterCaptchaDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f0f0] p-6">
      <ImposterCaptcha scale={0.5} fontFamily={inter.style.fontFamily} typography={{ title: 28, subtitle: 17, timer: 20, error: 17 }} />
    </main>
  );
}
