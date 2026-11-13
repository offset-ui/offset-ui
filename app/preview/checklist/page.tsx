import { Noto_Color_Emoji } from "next/font/google";
import { Checklist } from "@/components/ui/checklist";

const emoji = Noto_Color_Emoji({ subsets: ["emoji"], weight: "400", display: "swap", preload: false });

export default function ChecklistDemo() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f2f2] p-6" style={{ fontFamily: `"Segoe UI", ${emoji.style.fontFamily}, system-ui, sans-serif` }}>
      <Checklist />
    </main>
  );
}
