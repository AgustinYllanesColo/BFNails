"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/format";
import { MQ } from "@/lib/motion-core";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { FloatingNails } from "@/components/motion/FloatingNails";
import { Magnetic } from "@/components/motion/Magnetic";
import { Marquee } from "@/components/motion/Marquee";
import { SpinningBadge } from "@/components/motion/SpinningBadge";
import { LogoStar } from "@/components/brand/LogoStar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import s from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Trío de estrellas del logo (1 : .45 : .25), en % de la caja del logo, en los huecos del dibujo: arriba a la
 * izquierda del "nails", arriba a la derecha de "BF STUDIO" y abajo a la derecha, junto a la Kitty.
 */
const STARS = [
  { left: "6%", top: "12%", size: 26, delay: 350, twinkle: -0.4 },
  { left: "88%", top: "6%", size: 12, delay: 420, twinkle: -1.6 },
  { left: "93%", top: "80%", size: 8, delay: 490, twinkle: -2.5 },
];

/**
 * Hero de la home (PLAN W2-A): el logo real, grande, "se aplica y brilla" sobre el papel crema.
 *
 * Intro en CSS desde un estado ya visible (`Hero.module.css`): el logo se apoya (900 ms) y un brillo de top coat lo
 * barre; el copy sube desde opacidad .35; uñas y estrellas entran alrededor. Ambiente constante adentro de un
 * `AmbientZone`: el logo flota, la fila de contorno corre, las uñas derivan, las estrellas titilan, el sello gira.
 *
 * Al scrollear (GSAP, cada responsabilidad en su nodo): el logo se despega (escala .72, sube 30 %, gira −3°, funde a
 * .15), la fila baja más lento, el copy sube y se va desde el 35 % y el indicador se apaga en 120 px. Con
 * reduced-motion solo funden el logo y el indicador.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MQ, (ctx) => {
      const { reduced } = ctx.conditions as Record<keyof typeof MQ, boolean>;
      const q = gsap.utils.selector(el);
      const across = { trigger: el, start: "top top", end: "bottom top", scrub: 0.4 };

      if (reduced) {
        gsap.fromTo(
          q("[data-hero-logo-scroll]"),
          { autoAlpha: 1 },
          { autoAlpha: 0.15, ease: "none", immediateRender: false, scrollTrigger: across },
        );
      } else {
        gsap.fromTo(
          q("[data-hero-logo-scroll]"),
          { scale: 1, yPercent: 0, rotate: 0, autoAlpha: 1 },
          {
            scale: 0.72,
            yPercent: -30,
            rotate: -3,
            autoAlpha: 0.15,
            ease: "none",
            immediateRender: false,
            scrollTrigger: across,
          },
        );
        gsap.fromTo(
          q("[data-hero-rows]"),
          { yPercent: 0 },
          { yPercent: 25, ease: "none", immediateRender: false, scrollTrigger: across },
        );
        gsap.fromTo(
          q("[data-hero-copy]"),
          { yPercent: 0, autoAlpha: 1 },
          {
            yPercent: -20,
            autoAlpha: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: el, start: "35% top", end: "bottom top", scrub: 0.4 },
          },
        );
      }
      gsap.fromTo(
        q("[data-hero-cue]"),
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: el, start: "top top", end: "+=120", scrub: true },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <AmbientZone
      as="section"
      ref={root}
      data-hero=""
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-[var(--gutter)] pt-[calc(var(--nav-h)+16px)] pb-20 md:pb-24"
    >
      {/* Fondo: una sola fila de contorno, limitada a la banda del logo y enmascarada en los costados */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[30%] -z-10 -translate-y-1/2 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] md:top-[42%]"
      >
        <div data-hero-rows="">
          <div className={s.rows}>
            <Marquee
              variant="outline"
              items={["press-on", "soft gel"]}
              speed={44}
              reactive={false}
              className="font-display text-[clamp(5rem,16vw,15rem)] leading-[0.95] opacity-[0.08] md:opacity-[0.1]"
            />
          </div>
        </div>
      </div>
      <FloatingNails className="-z-10" />

      {/* Logo: banda quieta (centra el halo) › scroll (GSAP) › flotación › intro › imagen + sombra + brillo */}
      <div className="relative flex w-full justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -z-20 aspect-square w-[min(90vw,1100px)] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgb(245_232_200/0.95)_0%,rgb(226_194_155/0.28)_42%,rgb(254_247_231/0)_68%)]"
        />
        <div data-hero-logo-scroll="" className="relative w-[min(86vw,620px)] md:w-[680px]">
          <div data-ambient="move" className="animate-logo-float [animation-delay:1.4s]">
            <div className={s.press}>
              <Image
                src="/brand/logo-nails.webp"
                width={960}
                height={582}
                alt="BF Nails Studio"
                unoptimized
                loading="eager"
                fetchPriority="high"
                crossOrigin="anonymous"
                className="drop-shadow-logo block h-auto w-full"
              />
              <span aria-hidden className={s.contact} />
              <span aria-hidden className={s.sheenMask}>
                <span
                  data-ambient="move"
                  className={cn(
                    s.sheen,
                    "animate-[sheen_calc(9s*var(--amb-k))_var(--ease-move)_650ms_infinite] motion-reduce:[animation-iteration-count:1]",
                  )}
                />
              </span>
            </div>
            {STARS.map((star) => (
              <div
                key={star.left}
                aria-hidden
                data-hero-star=""
                className="pointer-events-none absolute -translate-1/2"
                style={{ left: star.left, top: star.top }}
              >
                <div className="animate-pop-in" style={{ animationDelay: `${star.delay}ms` }}>
                  <span
                    data-ambient="move"
                    className="animate-twinkle block"
                    style={{ animationDelay: `${star.twinkle}s` }}
                  >
                    <LogoStar size={star.size} tilt />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copy + CTAs: sube desde .35 (CSS); al scrollear se va (GSAP, en el wrapper) */}
      <div data-hero-copy="" className="relative w-full">
        <div className={cn(s.rise, "flex flex-col items-center text-center")}>
          <h1
            id="hero-title"
            className="font-display text-h3 text-ink mt-5 max-w-[18ch] text-balance md:mt-6"
          >
            Press-on de <span className="whitespace-nowrap">soft gel</span>, a tu talle.
          </h1>
          <p data-hero-lead="" className="text-lead text-ink-soft mt-3 max-w-[34ch] md:max-w-[38ch]">
            Hechas a mano por Bren, listas para pegar. Elegís del catálogo, armás el tuyo o nos pasás el
            diseño que viste.
          </p>
          <div data-hero-ctas="" className="mt-7 grid w-full max-w-[23rem] grid-cols-2 gap-3">
            <Magnetic className="w-full">
              <Button href="/catalogo" size="lg" data-cursor="ver" className="w-full px-5">
                Ver catálogo
              </Button>
            </Magnetic>
            <Magnetic className="w-full">
              <Button
                href="/disena"
                size="lg"
                variant="secondary"
                data-cursor="armar"
                className="w-full px-5"
              >
                Diseñá tu set
              </Button>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Sello giratorio (solo desktop): entrada en el wrapper, giro adentro */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[clamp(16px,4vw,48px)] bottom-8 hidden md:block"
      >
        <div className={s.badge}>
          <SpinningBadge text="hechas a mano por Bren · Lanús · " size={140} />
        </div>
      </div>

      {/* Indicador: scroll (GSAP) › entrada (CSS) › rebote (ambiente) */}
      <div
        data-hero-cue=""
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className={s.cue}>
          <div data-ambient="move" className="animate-bounce-y">
            <Icon name="chevron" size={20} className="text-ink-soft block" />
          </div>
        </div>
      </div>
    </AmbientZone>
  );
}
