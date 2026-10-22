"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import { Heading, Section } from "@/components/ui/Section";
import { cn } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export const FAQ_ITEMS: Array<{ q: string; a: string; link?: { href: string; label: string } }> = [
  {
    q: "¿Qué son las press-on?",
    a: "Las press-on son uñas personalizadas, hechas a mano y diseñadas a tu gusto 💖. Podés elegir el diseño, la forma y el largo que más te guste. Son ideales para lucir unas uñas hermosas sin necesidad de ir al salón y perder tiempo, ya que te las podés colocar vos misma desde la comodidad de tu casa. Además, ¡las podés usar las veces que quieras siempre y cuando las cuides de la manera correcta!",
  },
  {
    q: "¿Cuánto tiempo duran?",
    a: "Pegándolas de la forma correcta pueden durarte de 1 a 2 semanas.",
  },
  {
    q: "¿Cuánto tarda mi pedido?",
    a: "Los sets personalizados pueden estar listos entre 2 y 7 días, dependiendo de la complejidad del set o de la cantidad de pedidos que tenga. Si sos de la zona y ponemos punto de encuentro o moto, es mucho más rápido. Si el envío es por Correo Argentino, sumado al tiempo que tarda el set, son aprox. de 5 a 10 días.",
  },
  {
    q: "¿Puedo pedir un diseño que vi en internet?",
    a: "Sí. Pegá el link en Diseñá tu set o escribime por WhatsApp.",
  },
  {
    q: "¿Qué viene incluido en el set de uñas?",
    a: "Incluye tu set de press-on y el kit de colocación para que las uses inmediatamente: pegamento, lima, buffer, wipes y palito de naranjo.",
  },
  {
    q: "¿Cómo pegármelas para que duren?",
    a: "Te dejo un video tutorial para aplicarlas correctamente:",
    link: { href: siteConfig.tutorial, label: "Ver el tutorial" },
  },
  {
    q: "¿Atendés de forma presencial?",
    a: "Sí, atiendo en Remedios de Escalada, a 4 cuadras de la estación. Si las press-on no son lo tuyo, los servicios que realizo son soft gel, kapping o semipermanente, con turno previo a coordinar por WhatsApp o Instagram.",
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
            <p className="text-ink-soft mt-4 max-w-[36ch]">¿Te quedó alguna duda? Escribime por WhatsApp o Instagram y hablamos.</p>
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
                      <p className="pb-6 leading-relaxed text-ink-soft">
                        {item.a}
                        {item.link && (
                          <>
                            {" "}
                            <a
                              href={item.link.href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-bordo font-semibold underline decoration-[1.5px] underline-offset-4"
                            >
                              {item.link.label}
                            </a>
                          </>
                        )}
                      </p>
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
