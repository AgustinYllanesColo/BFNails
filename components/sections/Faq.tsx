"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import { Heading, Section } from "@/components/ui/Section";
import { cn } from "@/lib/format";

export const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué son las press-on?",
    a: "Uñas ya hechas que se pegan sobre la tuya. Las hago a mano, flexibles y livianas. Duran de 1 a 3 semanas y se pueden reusar.",
  },
  {
    q: "¿Cómo sé mi medida?",
    a: "Dos opciones: una medida universal (S, M o L), con sets en stock para entrega inmediata, o una personalizada con el ancho de tus 10 uñas. En Medidas te muestro cómo medir.",
  },
  {
    q: "¿Cuánto tarda mi pedido?",
    a: "Los sets a pedido están en 3 a 7 días. Los que tengo en stock salen en el momento. Te aviso por WhatsApp.",
  },
  {
    q: "¿Cómo pago?",
    a: "Mercado Pago (tarjeta, dinero en cuenta, cuotas), transferencia o efectivo si retirás o te lo llevo en moto.",
  },
  {
    q: "¿Puedo pedir un diseño que vi en internet?",
    a: "Sí. En Diseñá tu set pegá el link (Pinterest, Instagram, TikTok) y te lo cotizo por WhatsApp antes de pagar.",
  },
  {
    q: "¿Qué viene en el kit?",
    a: "Las 10 uñas y el kit de colocación: pegamento, lima, lima buffer, wipes y palito de naranjo.",
  },
  {
    q: "¿También atendés en el estudio?",
    a: "Sí. En Remedios de Escalada, a 4 cuadras de la estación: soft gel, kapping y semi, con turno por WhatsApp o Instagram.",
  },
];

export function Faq({ items = FAQ_ITEMS, compact = false }: { items?: typeof FAQ_ITEMS; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  // En la página de preguntas va sin el padding de sección (py-0 no le gana a py-20 en la hoja de estilos)
  const Wrap = compact ? CompactWrap : Section;
  return (
    <Wrap tone="deep">
      <div className={cn(!compact && "container-x grid gap-10 md:grid-cols-[0.8fr_1.2fr]")}>
        {!compact && (
          <Reveal>
            <Heading>Preguntas frecuentes</Heading>
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
                  <span className="text-lg font-semibold tracking-tight text-ink md:text-xl">{item.q}</span>
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-pill bg-bordo text-cream transition-transform duration-300 ease-[var(--ease-out-expo)]",
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
    </Wrap>
  );
}

function CompactWrap({ children }: { children: React.ReactNode; tone?: string }) {
  return <div>{children}</div>;
}
