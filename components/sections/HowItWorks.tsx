"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eyebrow } from "@/components/ui/Section";
import { Star } from "@/components/motion/Marquee";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    n: "01",
    title: "Elegí o diseñá",
    text: "Un set del catálogo, uno armado por vos o el diseño que viste en Pinterest o TikTok. Nos pasás la foto y lo hacemos.",
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
    title: "Medí tu talle",
    text: "Elegís un talle estándar con nuestra guía, o nos mandás el ancho de cada una de tus diez uñas y las hacemos personalizadas.",
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
    text: "Mercado Pago, transferencia o efectivo al recibir. Confirmás por WhatsApp con un toque y Bren se pone a trabajar.",
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
    text: "Kit con las diez uñas, pegamento y lima. Se ponen en diez minutos, duran semanas y se vuelven a usar.",
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

/**
 * En desktop la sección se "pinea" y los pasos se recorren en horizontal con el
 * scroll (como en basement). En mobile es vertical con número sticky.
 */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // useLayoutEffect: el pin de ScrollTrigger mueve la sección dentro de un pin-spacer.
  // La limpieza tiene que revertirlo ANTES de que React saque el nodo del DOM al navegar,
  // si no React intenta removeChild sobre un padre que ya no es el suyo y la página se rompe.
  useLayoutEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => tr.scrollWidth - el.clientWidth;
      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      // Los números grandes se mueven más lento (profundidad)
      gsap.utils.toArray<HTMLElement>("[data-step-number]", el).forEach((n) => {
        gsap.fromTo(
          n,
          { xPercent: 30 },
          {
            xPercent: -30,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: 0.8,
            },
          },
        );
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    mm.add("(max-width: 1023px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-step]", el);
      cards.forEach((c, i) => {
        gsap.fromTo(
          c,
          { y: 40, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: "expo.out",
            delay: i * 0.05,
            scrollTrigger: { trigger: c, start: "top 88%" },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    // Contenedor propio de React: el pin-spacer de GSAP se inserta adentro, nunca entre React y su nodo.
    <div className="relative">
      <section ref={root} className="bg-bordo text-cream relative overflow-hidden lg:h-screen">
        <div className="container-x pt-20 lg:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow className="text-cream">Cómo funciona</Eyebrow>
              <h2 className="font-display text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.95] text-balance">
                De tu idea a tus manos <span className="text-yellow">en 4 pasos</span>
              </h2>
            </div>
            <p className="text-cream/70 hidden max-w-xs text-sm lg:block">
              Seguí bajando: los pasos se deslizan de costado.
            </p>
          </div>
        </div>

        <div
          ref={track}
          className="mt-10 flex flex-col gap-5 px-[clamp(16px,4vw,48px)] pb-20 lg:mt-14 lg:w-max lg:flex-row lg:gap-8 lg:pr-[40vw] lg:pb-0"
        >
          {STEPS.map((s, i) => (
            <article
              key={s.n}
              data-step
              className="group bg-cream text-ink ring-cream/10 relative flex shrink-0 flex-col justify-between overflow-hidden rounded-lg p-7 ring-1 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 lg:h-[62vh] lg:w-[min(32vw,520px)] lg:p-10"
            >
              <span
                data-step-number
                aria-hidden
                className="font-display text-bordo/10 pointer-events-none absolute -top-6 -right-2 text-[9rem] leading-none select-none lg:text-[13rem]"
              >
                {s.n}
              </span>
              <div className="relative flex items-center justify-between">
                <span className="font-display text-bordo text-3xl">{s.n}</span>
                <span className="rounded-pill bg-bordo/8 text-bordo group-hover:bg-bordo group-hover:text-cream grid size-14 place-items-center transition-all duration-500 group-hover:rotate-[-8deg] [&>svg]:size-7">
                  {s.icon}
                </span>
              </div>
              <div className="relative mt-10 lg:mt-0">
                <h3 className="font-display text-3xl leading-tight lg:text-4xl">{s.title}</h3>
                <p className="text-ink-soft mt-3 max-w-sm text-[15px] leading-relaxed">{s.text}</p>
              </div>
              <span
                aria-hidden
                className="text-yellow absolute right-6 bottom-6 opacity-0 transition-all duration-500 group-hover:rotate-45 group-hover:opacity-100"
              >
                <Star size={22} />
              </span>
              {i === STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,var(--bordo),var(--leopard)_55%,var(--yellow))]"
                />
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
