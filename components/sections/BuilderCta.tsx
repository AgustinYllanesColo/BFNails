"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { NailPreview } from "@/components/builder/NailPreview";
import { DEFAULT_BUILDER_CONFIG } from "@/lib/pricing";
import type { BuilderSelection } from "@/lib/types";
import { formatARS } from "@/lib/format";
import { quoteSelection } from "@/lib/pricing";

const DEMO: BuilderSelection[] = [
  { shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: ["francesita"] },
  { shape: "coffin", length: "largo", finish: "cromado", base: "bordo", extras: ["strass"] },
  { shape: "ovalada", length: "corto", finish: "glossy", base: "rosa", extras: ["3d", "glitter"] },
  { shape: "stiletto", length: "xl", finish: "glossy", base: "negro", extras: ["cat-eye", "strass"] },
  { shape: "cuadrada", length: "medio", finish: "mate", base: "milky", extras: ["animal-print", "personajes"] },
];

/** Teaser del armador: la vista previa cambia sola cada 2,6 s con el precio real. */
export function BuilderCta() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % DEMO.length), 2600);
    return () => clearInterval(id);
  }, []);
  const sel = DEMO[i];
  const quote = quoteSelection(sel, DEFAULT_BUILDER_CONFIG);
  const labels = [
    DEFAULT_BUILDER_CONFIG.shapes.find((s) => s.id === sel.shape)?.label,
    DEFAULT_BUILDER_CONFIG.lengths.find((s) => s.id === sel.length)?.label,
    ...sel.extras.map((e) => DEFAULT_BUILDER_CONFIG.extras.find((x) => x.id === e)?.label),
  ].filter(Boolean);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="container-x grid min-w-0 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Reveal className="min-w-0">
          <h2 className="font-display text-balance text-[clamp(2rem,4.4vw,3.25rem)] leading-[1]">Diseñá tu set</h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            Forma, largo, color, técnicas y dijes, con el precio al toque. ¿Viste un diseño en internet? Pegá el link y te lo cotizo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Magnetic>
              <Button href="/disena" size="lg" data-cursor="armar">
                Diseñá tu set
              </Button>
            </Magnetic>
            <span className="text-sm text-ink-soft">Desde {formatARS(DEFAULT_BUILDER_CONFIG.basePrice)} el kit completo</span>
          </div>
        </Reveal>
        <Reveal y={60} className="min-w-0">
          <div className="relative min-w-0 rounded-lg bg-white p-3 shadow-[0_40px_80px_-40px_rgba(74,14,14,0.45)] ring-1 ring-bordo/10">
            <NailPreview sel={sel} config={DEFAULT_BUILDER_CONFIG} only2D />
            <div className="flex items-center justify-between gap-4 px-3 pt-3 pb-1">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{labels.join(" · ")}</p>
              <p key={quote.total} className="shrink-0 text-lg font-bold tabular-nums text-bordo md:text-xl">{formatARS(quote.total)}</p>
            </div>
            <div className="absolute -top-3 -left-3 rounded-pill bg-yellow px-3 py-1 text-[11px] font-bold tracking-wider text-ink uppercase shadow">demo en vivo</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
