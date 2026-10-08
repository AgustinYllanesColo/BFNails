"use client";

import { useEffect, useRef } from "react";
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
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M24 4l4.6 11.2L40 16l-9 7.4L33.4 36 24 29.6 14.6 36 17 23.4 8 16l11.4-.8z" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Medí tu talle",
    text: "Elegís un talle estándar con nuestra guía, o nos mandás el ancho de cada una de tus diez uñas y las hacemos personalizadas.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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

  useEffect(() => {
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
        gsap.fromTo(n, { xPercent: 30 }, { xPercent: -30, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, scrub: 0.8 } });
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    mm.add("(max-width: 1023px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-step]", el);
      cards.forEach((c, i) => {
        gsap.fromTo(c, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out", delay: i * 0.05, scrollTrigger: { trigger: c, start: "top 88%" } });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-bordo text-cream lg:h-screen">
      <div className="container-x pt-20 lg:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="text-cream">Cómo funciona</Eyebrow>
            <h2 className="font-display text-balance text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.95]">
              De tu idea a tus manos <span className="text-yellow">en 4 pasos</span>
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm text-cream/70 lg:block">Seguí bajando: los pasos se deslizan de costado.</p>
        </div>
      </div>

      <div ref={track} className="mt-10 flex flex-col gap-5 px-[clamp(16px,4vw,48px)] pb-20 lg:mt-14 lg:w-max lg:flex-row lg:gap-8 lg:pr-[40vw] lg:pb-0">
        {STEPS.map((s, i) => (
          <article
            key={s.n}
            data-step
            className="group relative flex shrink-0 flex-col justify-between overflow-hidden rounded-lg bg-cream p-7 text-ink ring-1 ring-cream/10 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 lg:h-[62vh] lg:w-[min(32vw,520px)] lg:p-10"
          >
            <span data-step-number aria-hidden className="pointer-events-none absolute -top-6 -right-2 font-display text-[9rem] leading-none text-bordo/10 select-none lg:text-[13rem]">
              {s.n}
            </span>
            <div className="relative flex items-center justify-between">
              <span className="font-display text-3xl text-bordo">{s.n}</span>
              <span className="grid size-14 place-items-center rounded-pill bg-bordo/8 text-bordo transition-all duration-500 group-hover:rotate-[-8deg] group-hover:bg-bordo group-hover:text-cream [&>svg]:size-7">
                {s.icon}
              </span>
            </div>
            <div className="relative mt-10 lg:mt-0">
              <h3 className="font-display text-3xl leading-tight lg:text-4xl">{s.title}</h3>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-soft">{s.text}</p>
            </div>
            <span aria-hidden className="absolute right-6 bottom-6 text-yellow opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:rotate-45">
              <Star size={22} />
            </span>
            {i === STEPS.length - 1 && (
              <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 leopard-bg" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
