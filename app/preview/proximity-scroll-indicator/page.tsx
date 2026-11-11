"use client";

import { Roboto } from "next/font/google";
import { ProximityScrollIndicator } from "@/components/ui/proximity-scroll-indicator";

const roboto = Roboto({ subsets: ["latin"], weight: ["400"] });

// Section copy matches the headings shown in the nav exactly.
const SECTIONS = [
  { id: "innovative-design-trends", title: "Innovative Design Trends", body: "New visual languages, motion-first interfaces and adaptive layouts are reshaping how products feel." },
  { id: "sustainable-materials", title: "Sustainable Materials", body: "Designers are rethinking the raw inputs of hardware and packaging, favouring recycled and bio-based options." },
  { id: "user-centric-interface", title: "User-Centric Interface", body: "Every interaction is measured against real user intent, not just visual polish." },
  { id: "accessibility-in-modern-design", title: "Accessibility in Modern Design", body: "Contrast, focus order and reduced motion are first-class citizens, not an afterthought pass." },
  { id: "the-future-of-prototyping", title: "The Future of  Prototyping", body: "Prototypes are becoming production-grade, closing the gap between design and shipped code." },
];

export default function ProximityScrollIndicatorDemo() {
  return (
    <main className={`${roboto.className} min-h-screen bg-[#fafaf9]`}>
      <ProximityScrollIndicator typography={{ fontFamily: roboto.style.fontFamily }} />

      {SECTIONS.map((s, i) => (
        <section key={s.id} id={s.id} className="flex min-h-screen flex-col items-center justify-center gap-4 border-b border-neutral-100 px-8 text-center">
          <span className="text-sm text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
          <h2 className="text-3xl font-medium text-neutral-900">{s.title}</h2>
          <p className="max-w-md text-neutral-500">{s.body}</p>
        </section>
      ))}
    </main>
  );
}
