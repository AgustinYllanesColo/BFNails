"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Magnetic } from "@/components/motion/Magnetic";
import { FloatingNails } from "@/components/motion/FloatingNails";
import { SpinningBadge } from "@/components/motion/SpinningBadge";
import { Button } from "@/components/ui/Button";

gsap.registerPlugin(ScrollTrigger);

const WORDS = ["press-on", "soft gel", "a tu talle", "hechas a mano", "lanús", "reutilizables"];

/**
 * Hero: el logo real de BF Studio, grande y centrado, sobre un fondo vivo:
 * dos filas de texto gigante en contorno que corren sin parar en direcciones
 * opuestas, y uñas press-on flotando a distintas profundidades.
 * Intro: el logo aparece desde el desenfoque; al scrollear se achica y se va.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(q("[data-hero-logo]"), { scale: 0.82, autoAlpha: 0, filter: "blur(18px)", y: 30 }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", y: 0, duration: 1.6 }, 0.1);
      tl.fromTo(q("[data-hero-copy] > *"), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.1 }, 0.9);
      tl.fromTo(q("[data-hero-badge]"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1, ease: "back.out(2)" }, 1.2);
      tl.fromTo(q("[data-hero-rows]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 }, 0.3);
      tl.fromTo(q("[data-hero-cue]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.8);

      // Flotación suave del logo, siempre
      gsap.to(q("[data-hero-logo]"), { y: -12, rotate: 1.2, duration: 3.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.8 });

      // Scroll: el logo se achica y sube, el fondo se va más lento
      gsap.to(q("[data-hero-logo]"), { scale: 0.6, yPercent: -40, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.4 } });
      gsap.to(q("[data-hero-rows]"), { yPercent: 25, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.4 } });
      gsap.to(q("[data-hero-copy]"), { yPercent: 30, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: el, start: "30% top", end: "bottom top", scrub: 0.4 } });
    }, el);
    return () => ctx.revert();
  }, []);

  const row = [...WORDS, ...WORDS, ...WORDS];

  return (
    <section ref={root} className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pt-24 pb-24 md:pt-28 md:pb-28">
      {/* Fondo: halo + filas de texto gigante en movimiento */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute top-1/2 left-1/2 size-[90vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,167,195,0.28)_0%,rgba(201,160,99,0.12)_38%,rgba(254,247,231,0)_66%)] animate-[float_10s_ease-in-out_infinite]" />
      </div>
      <div data-hero-rows aria-hidden className="pointer-events-none absolute inset-x-0 top-[34%] -z-10 -translate-y-1/2 select-none md:top-1/2">
        {[0, 1].map((r) => (
          <div key={r} className="flex overflow-hidden whitespace-nowrap">
            <div
              className="flex shrink-0 items-center gap-[0.35em] font-display text-[clamp(5rem,16vw,15rem)] leading-[0.95] outline-text opacity-[0.11] md:opacity-[0.16]"
              style={{ animation: `marquee ${r ? 48 : 40}s linear infinite ${r ? "reverse" : "normal"}` }}
            >
              {row.map((w, i) => (
                <span key={i} className="flex items-center gap-[0.35em]">
                  {w}
                  <span className="text-[0.35em] text-red [-webkit-text-stroke:0] not-italic" style={{ color: "var(--red)", WebkitTextStroke: 0 }}>
                    ✦
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <FloatingNails className="-z-10" />

      {/* Logo real */}
      <div data-hero-logo className="relative w-[min(88vw,760px)] will-change-transform">
        <Image src="/brand/logo-nails.webp" alt="BF Studio nails" width={960} height={580} priority fetchPriority="high" sizes="(min-width: 768px) 760px, 88vw" className="w-full drop-shadow-[0_30px_50px_rgba(74,14,14,0.22)]" />
      </div>

      {/* Copy + CTAs */}
      <div data-hero-copy className="relative mt-6 max-w-xl rounded-[2rem] bg-cream/70 px-5 py-4 text-center backdrop-blur-[2px] md:mt-8 md:bg-transparent md:py-0 md:backdrop-blur-none">
        <p className="text-xs font-bold tracking-[0.24em] text-bordo uppercase">Press-on en soft gel · hechas a mano en Lanús</p>
        <p className="mt-3 text-balance text-lg leading-relaxed text-ink-soft md:text-xl">Uñas a tu talle, listas para pegar. Elegís del catálogo, armás el tuyo o nos pasás el diseño que viste en internet.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Button href="/catalogo" size="lg" data-cursor="ver">
              Ver catálogo
            </Button>
          </Magnetic>
          <Magnetic>
            <Button href="/disena" size="lg" variant="secondary" data-cursor="armar">
              Diseñá tu set
            </Button>
          </Magnetic>
        </div>
      </div>

      <div data-hero-badge className="absolute bottom-8 left-[clamp(16px,4vw,48px)] hidden md:block">
        <SpinningBadge text="press-on · soft gel · a tu talle · " size={140} />
      </div>

      <div data-hero-cue aria-hidden className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-ink-soft uppercase">
        deslizá
        <span className="block h-10 w-px overflow-hidden bg-bordo/15">
          <span className="block h-1/2 w-full bg-bordo animate-[cue_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}
