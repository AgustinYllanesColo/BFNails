"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brush } from "@/components/motion/Brush";
import { Heading, Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { MQ, isInViewportNow, registerEases } from "@/lib/motion";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/format";

gsap.registerPlugin(ScrollTrigger);

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

/** El mismo mensaje que el link de WhatsApp del footer. */
const WA_HELLO = "Hola Bren! Te escribo desde la web 🐱";

type Props = { items?: typeof FAQ_ITEMS; compact?: boolean };

/**
 * Preguntas frecuentes (PLAN §4 W2-B.7). Es lectura: la lista no tiene coreografía; la entrada es la pincelada de
 * "preguntan" y la Kitty que asoma junto al titular.
 *
 * - Home: grilla con la columna del titular sticky en lg (Kitty de 160 px + WhatsApp). En el celular la Kitty de 72
 *   px va junto al H2 y no hay botón al pie: el Cierre, que viene justo después, es el CTA.
 * - `compact` (contrato con W2-F, /faq): devuelve SOLO la lista, sin sección ni contenedor.
 *
 * Acordeón: botón dentro de un encabezado (h3 en la home, h2 en /faq, que arranca con su h1), ícono más/menos en SVG
 * (el trazo vertical se aplana con `scaleY`, con `transform-box` para girar desde su centro), panel por
 * `grid-template-rows` 0fr → 1fr (260 ms al abrir, 180 al cerrar) e `inert` cerrado. Flechas, Inicio y Fin mueven el
 * foco entre preguntas.
 */
export function Faq({ items = FAQ_ITEMS, compact = false }: Props) {
  const list = <FaqList items={items} headingLevel={compact ? 2 : 3} />;
  if (compact) return list;
  return <FaqSection>{list}</FaqSection>;
}

function FaqSection({ children }: { children: React.ReactNode }) {
  const peek = useRef<HTMLDivElement>(null);

  // La Kitty del celular asoma desde abajo (y 60 % → 0) con un rebote corto, una vez.
  useEffect(() => {
    const el = peek.current;
    if (!el) return;
    registerEases();
    const mm = gsap.matchMedia();
    mm.add(`(max-width: 1023px) and ${MQ.full}`, () => {
      if (isInViewportNow(el)) return;
      gsap.fromTo(
        el,
        { yPercent: 60, rotate: -8, autoAlpha: 0 },
        {
          yPercent: 0,
          rotate: 0,
          autoAlpha: 1,
          duration: 0.7,
          ease: "back.out(1.4)",
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <Section id="preguntas" tone="deep" spacing="tight" aria-labelledby="preguntas-titulo">
      <div className="container-x grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="relative lg:sticky lg:top-[calc(var(--nav-h)+32px)] lg:self-start">
          <Heading id="preguntas-titulo" className="pr-[88px] lg:pr-0">
            Lo que todas <Brush mode="view">preguntan</Brush>
          </Heading>
          {/* Celular: Kitty sticker junto al titular */}
          <div aria-hidden className="absolute -top-3 right-0 rotate-6 lg:hidden">
            <div ref={peek}>
              <Image
                src="/brand/kitty-sticker.webp"
                width={564}
                height={666}
                alt=""
                sizes="72px"
                className="h-auto w-[72px]"
              />
            </div>
          </div>
          {/* Desktop: Kitty grande + WhatsApp, quietos en la columna sticky */}
          <div aria-hidden className="mt-10 hidden w-40 -rotate-6 lg:block">
            <Image
              src="/brand/kitty-sticker.webp"
              width={564}
              height={666}
              alt=""
              sizes="160px"
              className="h-auto w-full"
            />
          </div>
          <Button
            href={waLink(WA_HELLO)}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="md"
            iconLeft="whatsapp"
            className="mt-8 hidden lg:inline-flex"
          >
            Escribile a Bren
          </Button>
        </div>
        {children}
      </div>
    </Section>
  );
}

function FaqList({ items, headingLevel }: { items: typeof FAQ_ITEMS; headingLevel: 2 | 3 }) {
  const [open, setOpen] = useState<number | null>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const H = headingLevel === 2 ? "h2" : "h3";

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-faq-q]") ?? [])];
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % buttons.length;
    else if (e.key === "ArrowUp") next = (i - 1 + buttons.length) % buttons.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = buttons.length - 1;
    if (next < 0) return;
    e.preventDefault();
    buttons[next]?.focus();
  };

  return (
    <div ref={listRef} className="divide-bordo/10 border-bordo/10 min-w-0 divide-y border-y">
      {items.map((item, i) => {
        const isOpen = open === i;
        const q = `faq-q-${i}`;
        const a = `faq-a-${i}`;
        return (
          <div key={item.q}>
            <H className="m-0">
              <button
                id={q}
                type="button"
                data-faq-q=""
                aria-expanded={isOpen}
                aria-controls={a}
                onClick={() => setOpen(isOpen ? null : i)}
                onKeyDown={(e) => onKey(e, i)}
                className="group flex min-h-14 w-full items-center justify-between gap-6 rounded-md py-5 text-left transition-[scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.99]"
              >
                <span
                  className={cn(
                    "group-hover:text-bordo font-sans text-[18px] leading-[1.35] font-semibold transition-colors duration-200 md:text-[19px]",
                    isOpen ? "text-bordo" : "text-ink",
                  )}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className="rounded-pill bg-bordo text-cream group-hover:bg-bordo-soft grid size-10 shrink-0 place-items-center transition-colors duration-200 ease-[var(--ease-ui)]"
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                  >
                    <path d="M3 8h10" />
                    <path
                      d="M8 3v10"
                      className="origin-center transition-transform duration-200 ease-[var(--ease-ui)] [transform-box:fill-box]"
                      style={{ transform: `scaleY(${isOpen ? 0 : 1})` }}
                    />
                  </svg>
                </span>
              </button>
            </H>
            <div
              id={a}
              role="region"
              aria-labelledby={q}
              data-open={isOpen}
              inert={!isOpen}
              className="grid transition-[grid-template-rows] duration-[260ms] ease-[var(--ease-ui)] data-[open=false]:grid-rows-[0fr] data-[open=false]:duration-[180ms] data-[open=true]:grid-rows-[1fr]"
            >
              <div className="min-h-0 overflow-hidden">
                <p className="text-body text-ink-soft measure pr-12 pb-6">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
