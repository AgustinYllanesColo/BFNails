"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, Heading, Section } from "@/components/ui/Section";
import { cn } from "@/lib/format";

export const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué son las press-on en soft gel?",
    a: "Press-on son uñas ya hechas que se pegan sobre tu uña natural. Las nuestras están fabricadas en soft gel, un material flexible y liviano que se adapta a la curva de tu uña (mucho más cómodo que el plástico de las press-on comunes) y decoradas con esmalte semipermanente. Duran entre 1 y 3 semanas y se pueden despegar y volver a usar.",
  },
  {
    q: "¿Cómo sé mi talle?",
    a: "Tenés dos caminos. El rápido: elegir un talle estándar (XS, S, M, L) con nuestra guía. El exacto: medir el ancho de cada una de tus diez uñas en milímetros y mandárnoslo; con eso Bren hace el set personalizado a tu mano. En la página de talles te mostramos cómo medir paso a paso.",
  },
  {
    q: "¿Cuánto tarda mi pedido?",
    a: "Cada set se hace a mano y a pedido. En general está listo entre 3 y 7 días según la complejidad y la cola de pedidos. Te vamos avisando por WhatsApp.",
  },
  {
    q: "¿Cómo pago?",
    a: "Con Mercado Pago (tarjetas, dinero en cuenta, cuotas), por transferencia a un alias o en efectivo al recibir si retirás en la estación o te lo llevamos en moto. El pedido se confirma por WhatsApp.",
  },
  {
    q: "¿Puedo pedir un diseño que vi en internet?",
    a: "Sí, es de lo que más hacemos. En Diseñá tu set pegá el link de Pinterest, Instagram o TikTok (o describilo en las notas) y Bren te lo cotiza por WhatsApp antes de pagar. Si preferís, armá el tuyo con las opciones y ves el precio al instante.",
  },
  {
    q: "¿Qué viene en el kit?",
    a: "Las 10 uñas de tu talle, pegamento, lima y una guía rápida de aplicación y cuidado.",
  },
];

export function Faq({ items = FAQ_ITEMS, compact = false }: { items?: typeof FAQ_ITEMS; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section tone={compact ? "cream" : "deep"} className={cn(compact && "py-0 md:py-0")}>
      <div className={cn("container-x", !compact && "grid gap-10 md:grid-cols-[0.8fr_1.2fr]")}>
        {!compact && (
          <Reveal>
            <Eyebrow>Preguntas</Eyebrow>
            <Heading>
              Lo que todas <span className="text-bordo">preguntan</span>
            </Heading>
          </Reveal>
        )}
        <Reveal className="divide-y divide-bordo/10">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-display text-xl text-ink md:text-2xl">{item.q}</span>
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-pill bg-bordo text-cream transition-transform duration-500 ease-[var(--ease-bounce)]",
                      isOpen && "rotate-45",
                    )}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 leading-relaxed text-ink-soft">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </Section>
  );
}
