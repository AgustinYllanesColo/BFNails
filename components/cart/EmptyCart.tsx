"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { Design } from "@/lib/types";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/format";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { Paper, PrinterHead, TicketRow, TicketRule } from "@/components/ui/ticket";
import { Button } from "@/components/ui/Button";
import { DesignCard } from "@/components/catalog/DesignCard";

/**
 * Bolsita vacía (PLAN W2-E.2), compartida por el carrito y el checkout: la impresora en espera con el papel en cero y
 * la Kitty que asoma por detrás del cabezal (sube 700 ms y después respira apenas, `peek-idle`). Debajo, los dos
 * caminos del mismo ancho y "Para arrancar" con tres sets del catálogo (los destacados que manda la página).
 */
export function EmptyCart({
  suggestions = [],
  title = "Tu bolsita está vacía",
  className,
}: {
  suggestions?: Design[];
  title?: string;
  className?: string;
}) {
  return (
    <AmbientZone className={cn("min-w-0", className)}>
      <div className="grid gap-10 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-center lg:gap-16">
        {/* Impresora en espera */}
        <div className="mx-auto w-full max-w-[360px] lg:mx-0">
          <div className="relative pt-12">
            {/* La Kitty asoma por detrás del cabezal: posición › entrada › respiración › inclinación (un nodo cada una) */}
            <div aria-hidden className="pointer-events-none absolute -top-4 right-9 z-0 h-16 w-14">
              <motion.div
                className="h-full w-full"
                initial={{ transform: "translateY(110%)" }}
                animate={{ transform: "translateY(0%)" }}
                transition={{ duration: 0.7, ease: EASE.expo, delay: 0.25 }}
              >
                <div data-ambient="move" className="animate-peek-idle h-full w-full">
                  <div className="h-full w-full -rotate-6">
                    <Image src="/brand/kitty.webp" alt="" width={508} height={600} sizes="56px" className="h-full w-auto" />
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="relative z-10">
              <PrinterHead status="waiting" label="esperando" />
            </div>
            <div className="relative z-10 -mt-2 px-2">
              <Paper seed={3}>
                <div className="flex items-baseline justify-between gap-3 font-bold tracking-[0.04em] uppercase">
                  <span>BF Studio · tu bolsita</span>
                </div>
                <TicketRule />
                <TicketRow label="sets" value="0" />
                <TicketRule variant="double" />
                <TicketRow label="TOTAL" value="$ 0" className="text-[20px] leading-none font-bold" />
                <TicketRule />
                <p className="text-ink-soft text-center text-[13px]">* todavía no imprimimos nada *</p>
              </Paper>
            </div>
          </div>
        </div>

        {/* Qué hacer */}
        <div className="min-w-0 text-center lg:text-left">
          <h2 className="font-display text-h3 text-ink">{title}</h2>
          <p className="text-ink-soft mx-auto mt-3 max-w-[36ch] lg:mx-0">
            Elegí un set del catálogo o armá el tuyo con precio al instante. Cada set trae 10 uñas, pegamento y lima.
          </p>
          <div className="mx-auto mt-6 grid max-w-[400px] grid-cols-2 gap-3 lg:mx-0">
            <Button href="/catalogo" size="md" className="px-4">
              Ver catálogo
            </Button>
            <Button href="/disena" variant="secondary" size="md" className="px-4">
              Diseñá tu set
            </Button>
          </div>
        </div>
      </div>

      {suggestions.length ? (
        <section aria-labelledby="para-arrancar" className="mt-[var(--stack-heading)] border-line border-t pt-10">
          <h2 id="para-arrancar" className="font-display text-h3 text-ink">
            Para arrancar
          </h2>
          <ul className="-mx-[var(--gutter)] mt-6 flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-3 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 lg:max-w-[920px] sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {suggestions.slice(0, 3).map((d) => (
              <li key={d.slug} className="w-[58%] shrink-0 snap-start sm:w-auto">
                <DesignCard design={d} sizes="(min-width: 640px) 30vw, 58vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AmbientZone>
  );
}
