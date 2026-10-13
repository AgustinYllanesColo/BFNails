"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Magnetic } from "@/components/motion/Magnetic";
import { HeroPhotos } from "@/components/motion/HeroPhotos";
import { SpinningBadge } from "@/components/motion/SpinningBadge";
import { Button } from "@/components/ui/Button";

/**
 * Hero: el logo real de BF Studio, grande y centrado, sobre un halo cálido, con fotos reales de sets
 * alrededor como stickers. Una sola intro corta (logo, fotos, copy, sello) y después nada corre por
 * cuadro: ni filas de texto en movimiento ni parallax atado al scroll. Lo único vivo es una
 * flotación suave del logo, en CSS.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: reduce ? 0.3 : 1 } });
      tl.fromTo(
        q("[data-hero-logo]"),
        { scale: 0.94, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: reduce ? 0.3 : 1.1 },
        0.05,
      );
      tl.fromTo(
        q("[data-hero-photo]"),
        { autoAlpha: 0, y: reduce ? 0 : 18 },
        { autoAlpha: 1, y: 0, stagger: 0.08 },
        0.35,
      );
      tl.fromTo(
        q("[data-hero-copy] > *"),
        { autoAlpha: 0, y: reduce ? 0 : 16 },
        { autoAlpha: 1, y: 0, stagger: 0.08 },
        0.55,
      );
      tl.fromTo(
        q("[data-hero-badge]"),
        { autoAlpha: 0, scale: 0.8 },
        { autoAlpha: 1, scale: 1, ease: "back.out(1.6)" },
        0.9,
      );
      tl.fromTo(q("[data-hero-cue]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1.3);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pt-24 pb-24 md:pt-28 md:pb-28"
    >
      {/* Fondo: halo cálido, estático */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute top-1/2 left-1/2 size-[90vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,167,195,0.3)_0%,rgba(201,160,99,0.12)_38%,rgba(254,247,231,0)_66%)]" />
      </div>
      <HeroPhotos className="-z-10" />

      {/* Logo real: flota apenas, en CSS */}
      <div data-hero-logo className="relative w-[min(88vw,760px)]">
        <div className="motion-safe:animate-[float_7s_ease-in-out_infinite]">
          <Image
            src="/brand/logo-nails.webp"
            alt="BF Studio nails"
            width={960}
            height={580}
            priority
            fetchPriority="high"
            sizes="(min-width: 768px) 760px, 88vw"
            className="w-full drop-shadow-[0_30px_50px_rgba(74,14,14,0.22)]"
          />
        </div>
      </div>

      {/* Copy + CTAs */}
      <div data-hero-copy className="relative mt-6 max-w-xl px-5 text-center md:mt-8">
        <p className="text-bordo text-xs font-bold tracking-[0.24em] uppercase">
          Press-on a tu talle · hechas a mano en Escalada
        </p>
        <p className="text-ink-soft mt-3 text-lg leading-relaxed text-balance md:text-xl">
          Uñas a tu talle, listas para pegar. Elegís del catálogo, armás el tuyo o nos pasás el
          diseño que viste en internet.
        </p>
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

      <div
        data-hero-badge
        className="absolute bottom-8 left-[clamp(16px,4vw,48px)] hidden md:block"
      >
        <SpinningBadge text="press-on · a tu talle · hechas a mano · " size={140} />
      </div>

      <div
        data-hero-cue
        aria-hidden
        className="text-ink-soft absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase"
      >
        deslizá
        <span className="bg-bordo/15 block h-10 w-px overflow-hidden">
          <span className="bg-bordo block h-1/2 w-full animate-[cue_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}
