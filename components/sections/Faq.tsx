"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, Heading, Section } from "@/components/ui/Section";
import { cn } from "@/lib/format";

export const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué son las press-on soft gel?",
    a: "Uñas hechas en soft gel, un material flexible y liviano que se adapta a tu uña natural. Se pegan con el pegamento del kit y, bien cuidadas, duran entre 1 y 3 semanas. Se pueden despegar y volver a usar.",
  },
  {
    q: "¿Cómo sé mi talle?",
    a: "Tenés dos caminos: elegir un talle estándar (XS, S, M, L) o medir cada uña en milímetros con una cinta o un papelito. En la página de talles te mostramos cómo, paso a paso. Si dudás, lo resolvemos por WhatsApp.",
  },
  {
    q: "¿Cuánto tarda mi pedido?",
    a: "Cada set se hace a mano y a pedido. En general está listo entre 3 y 7 días según la complejidad y la cola de pedidos. Te vamos avisando por WhatsApp.",
  },
  {
    q: "¿Cómo pago?",
    a: "Con Mercado Pago (tarjetas, dinero en cuenta, cuotas) o por transferencia a un alias. El pedido se confirma por WhatsApp una vez hecho el pago.",
  },
  {
    q: "¿Puedo pedir un diseño que no está en el catálogo?",
    a: "Sí. En Diseñá tu set armás el tuyo y ves el precio al instante. Si querés algo muy particular, dejanos una nota o una foto de referencia y Bren te cotiza por WhatsApp antes de pagar.",
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
