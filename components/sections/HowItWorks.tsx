"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "@/components/motion/Marquee";
import { KitItems } from "@/components/kit/KitItems";
import type { Kit } from "@/lib/data/content";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    n: "01",
    title: "Elegí o diseñá",
    text: "Un set del catálogo, uno armado por vos o el diseño que viste. Me pasás la foto y lo hago.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M24 4l4.6 11.2L40 16l-9 7.4L33.4 36 24 29.6 14.6 36 17 23.4 8 16l11.4-.8z" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Elegí tu medida",
    text: "Universal (S, M o L) o personalizada con tus 10 medidas.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="6" y="18" width="36" height="12" rx="3" />
        <path d="M12 18v5M18 18v8M24 18v5M30 18v8M36 18v5" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Pagá como quieras",
    text: "Mercado Pago, transferencia o efectivo. Me confirmás por WhatsApp y arranco.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="6" y="12" width="36" height="24" rx="4" />
        <path d="M6 20h36M12 29h8" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Recibí y pegá",
    text: "Con el kit de colocación. Se ponen en 10 minutos y se reusan.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M8 18l16-8 16 8v16l-16 8-16-8z" />
        <path d="M8 18l16 8 16-8M24 26v16" />
      </svg>
    ),
  },
];


/** Imagen o gráfico de cada paso: fotos reales donde hay, un gráfico de marca donde no. */
const VISUALS: Record<string, { src?: string; alt?: string }> = {
  "01": { src: "/catalog/set-gems-french.webp", alt: "Francesita con gemas de colores" },
  "02": {},
  "03": {},
  "04": { src: "/catalog/set-milky-gold-foil.webp", alt: "Set milky con foil dorado listo para pegar" },
};

/**
 * Cuatro pasos en vertical, con una línea que los une y una imagen por paso. Los pasos entran
 * de a uno al scrollear; nada se "pinea": se lee de corrido en cualquier pantalla.
 */
export function HowItWorks({ kit }: { kit?: Kit }) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("all", () => {
      const line = el.querySelector<SVGLineElement>("[data-line]");
      // si se recargó con la sección ya en pantalla, la línea queda entera (no se achica y vuelve a crecer)
      if (line && el.getBoundingClientRect().top > window.innerHeight * 0.6) {
        gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 80%", scrub: 0.5 } });
      }
      gsap.utils.toArray<HTMLElement>("[data-step]", el).forEach((c) => {
        if (c.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        gsap.fromTo(c, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 85%" } });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-bordo py-20 text-cream md:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-balance text-[clamp(2rem,4.4vw,3.25rem)] leading-[1]">Cómo funciona</h2>
          <p className="mt-5 max-w-sm text-cream/75">
            A pedido, entre 3 y 7 días. Te aviso por WhatsApp.
          </p>
          <div className="mt-8 hidden items-center gap-3 lg:flex">
            <Star size={18} className="text-yellow" />
            <span className="text-sm text-cream/70">Reutilizables: se despegan y se vuelven a usar.</span>
          </div>
        </div>

        <ol className="relative space-y-6 md:space-y-8">
          {/* línea que une los pasos y se dibuja al scrollear */}
          <span aria-hidden className="pointer-events-none absolute top-8 bottom-8 left-[27px] w-px bg-cream/15 md:left-[31px]">
            <span data-line className="block h-full w-full origin-top bg-yellow" />
          </span>
          {STEPS.map((s) => {
            const v = VISUALS[s.n];
            return (
              <li key={s.n} data-step className="relative pl-[72px] md:pl-[84px]">
                <span className="absolute top-0 left-0 grid size-14 place-items-center rounded-pill bg-yellow font-display text-2xl text-bordo shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] md:size-16 md:text-3xl">
                  {s.n}
                </span>
                <article className="grid overflow-hidden rounded-lg bg-cream text-ink ring-1 ring-cream/10 sm:grid-cols-[1fr_0.8fr]">
                  <div className="order-2 p-6 sm:order-1 md:p-8">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-pill bg-bordo/8 text-bordo [&>svg]:size-5">{s.icon}</span>
                      <h3 className="font-display text-2xl leading-tight md:text-3xl">{s.title}</h3>
                    </div>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{s.text}</p>
                    {s.n === "04" && kit?.items.length ? (
                      <>
                        <p className="mt-4 text-xs font-semibold text-ink">El kit trae:</p>
                        <KitItems items={kit.items} className="mt-2" />
                      </>
                    ) : null}
                  </div>
                  <div className="relative order-1 min-h-[180px] overflow-hidden bg-cream-deep sm:order-2 sm:min-h-0">
                    {v.src ? (
                      <Image src={v.src} alt={v.alt ?? ""} fill sizes="(min-width: 1024px) 28vw, (min-width: 640px) 40vw, 100vw" quality={90} className="object-cover" />
                    ) : s.n === "02" ? (
                      <Ruler />
                    ) : (
                      <PayMarks />
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** Regla con cinco uñas marcadas: el gesto de medir, dibujado con la paleta de marca. */
function Ruler() {
  // Medida S de la tabla de Brenda, en mm (se muestra en cm, como en su guía).
  const widths = [15, 11, 12, 11, 9];
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col justify-end gap-4 p-5">
      <div className="flex items-end justify-around">
        {widths.map((w, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="block rounded-t-full rounded-b-md bg-[#e8c4b0] shadow-[inset_-3px_0_6px_rgba(74,14,14,0.08)]" style={{ width: w * 3, height: 36 + (i % 2) * 10 }} />
            <span className="font-mono text-[10px] font-bold text-bordo">{(w / 10).toFixed(1).replace(".", ",")}</span>
          </div>
        ))}
      </div>
      <div className="relative h-8 rounded-md bg-cream-ink/70 ring-1 ring-bordo/10">
        <div className="absolute inset-x-2 top-0 h-full bg-[repeating-linear-gradient(90deg,var(--bordo)_0_1px,transparent_1px_8px)] opacity-70" />
        <div className="absolute inset-x-2 top-0 h-1/2 bg-[repeating-linear-gradient(90deg,var(--bordo)_0_1px,transparent_1px_40px)]" />
      </div>
    </div>
  );
}

/** Tres formas de pagar, como stickers. */
function PayMarks() {
  const items = [
    { label: "Mercado Pago", cls: "bg-[#009ee3] text-white -rotate-3" },
    { label: "Transferencia", cls: "bg-bordo text-cream rotate-2" },
    { label: "Efectivo", cls: "bg-yellow text-ink -rotate-2" },
  ];
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
      {items.map((it) => (
        <span key={it.label} className={`rounded-pill px-5 py-2 text-sm font-bold shadow-[0_12px_24px_-12px_rgba(74,14,14,0.5)] ${it.cls}`}>
          {it.label}
        </span>
      ))}
    </div>
  );
}
