"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MQ } from "@/lib/motion-core";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { FloatingNails } from "@/components/motion/FloatingNails";
import { Magnetic } from "@/components/motion/Magnetic";
import { Marquee } from "@/components/motion/Marquee";
import { SpinningBadge } from "@/components/motion/SpinningBadge";
import { LOGO_STAR_PATH, LogoStar } from "@/components/brand/LogoStar";
import { Button } from "@/components/ui/Button";
import { Brush } from "@/components/motion/Brush";
import { Icon } from "@/components/ui/icons";
// Global a propósito (los .module.css de este proyecto no tienen alcance local): clases con prefijo `bfh-`.
import "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Trío de estrellas del logo (1 : .45 : .25), en % de la caja del logo y en los huecos del dibujo: abajo entre la
 * estrella grande y la Kitty, arriba de "BF STUDIO" y afuera de la punta izquierda de la estrella grande.
 */
const STARS = [
  { left: "42%", top: "91%", size: 26, delay: 350, twinkle: -0.4 },
  { left: "83%", top: "4%", size: 12, delay: 420, twinkle: -1.6 },
  { left: "4%", top: "68%", size: 8, delay: 490, twinkle: -2.5 },
];

/**
 * Hero de la home (PLAN W2-A): el logo real, grande, "se aplica y brilla" sobre el papel crema, con un sol de rayos
 * 70s detrás (el mismo mundo que el lettering del logo) y el sello de Bren pegado al costado.
 *
 * Celular primero: composición de póster. El logo se lleva el aire libre (60 % arriba, 40 % abajo) y el copy con los
 * CTAs queda anclado abajo, en la zona del pulgar. Desde md todo se centra y el logo se achica en pantallas bajas para
 * que los CTAs siempre entren en el primer viewport.
 *
 * Intro en CSS desde un estado ya visible (`Hero.module.css`): el logo se apoya (900 ms) y un brillo de top coat lo
 * barre; el copy sube desde opacidad .35; uñas, estrellas y sello entran alrededor. Ambiente constante adentro de un
 * `AmbientZone`: los rayos giran muy despacio, el logo flota, la fila de contorno corre, las uñas derivan, las
 * estrellas titilan y el sello gira.
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

  // Profundidad con el puntero (solo mouse/trackpad y sin reduced-motion): cada capa [data-depth] se corre en px
  // proporcionales a su profundidad (las negativas van en contra: los rayos quedan "atrás", las uñas "adelante").
  // quickTo con una sola curva de salida: interrumpible, sin acumular tweens. Nodos propios: no pisa scroll ni flotación.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mq = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;
    const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", el).map((n) => {
      const d = Number(n.dataset.depth) || 0;
      return {
        d,
        x: gsap.quickTo(n, "x", { duration: 1.1, ease: "power3.out" }),
        y: gsap.quickTo(n, "y", { duration: 1.1, ease: "power3.out" }),
      };
    });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      for (const l of layers) {
        l.x(nx * l.d);
        l.y(ny * l.d * 0.6);
      }
    };
    const leave = () => {
      for (const l of layers) {
        l.x(0);
        l.y(0);
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.set(gsap.utils.toArray("[data-depth]", el), { clearProps: "transform" });
    };
  }, []);

  return (
    <AmbientZone
      as="section"
      ref={root}
      data-hero=""
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col items-center overflow-hidden px-[var(--gutter)] pt-[calc(var(--nav-h)+16px)] pb-20 md:justify-center md:pb-[clamp(4rem,10svh,6rem)]"
    >
      <div data-depth="-48" className="pointer-events-none absolute inset-0 -z-10">
        <FloatingNails />
      </div>

      {/* Logo: banda (en el celular se lleva el aire libre, 60 % arriba) › caja del logo (centra rayos, halo y fila) ›
          scroll (GSAP) › flotación › intro › imagen + sombra + brillo */}
      <div className="relative flex w-full flex-1 flex-col items-center before:flex-[1.5] before:content-[''] after:flex-1 after:content-[''] md:flex-none md:before:hidden md:after:hidden">
        <div className="relative w-[min(92vw,620px)] md:w-[clamp(420px,min(78vw,calc((100svh-490px)*1.65)),680px)]">
          {/* Rayos de sol 70s (los del lettering del logo): giran muy despacio, se desvanecen antes del copy */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-20 -translate-1/2 [mask-image:radial-gradient(closest-side,#000_22%,transparent_88%)]"
          >
            <div data-depth="18">
              <div
                data-ambient="move"
                className="aspect-square w-[min(150vw,1440px)] animate-[spin-slow_calc(70s*var(--amb-k))_linear_infinite] rounded-full bg-[repeating-conic-gradient(from_0deg,rgb(245_232_200/0.8)_0deg_5.4deg,rgb(245_232_200/0)_6deg_14.4deg,rgb(245_232_200/0.8)_15deg)]"
              />
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-20 aspect-square w-[min(90vw,1100px)] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgb(245_232_200/0.95)_0%,rgb(226_194_155/0.28)_42%,rgb(254_247_231/0)_68%)]"
          />
          {/* Una sola fila de contorno, centrada en la caja del logo (nunca detrás del copy) y enmascarada en los costados */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[55%] left-1/2 z-[-15] w-screen -translate-1/2 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
          >
            <div data-hero-rows="">
              <div className="bfh-rows">
                <Marquee
                  variant="outline"
                  items={["press-on", "soft gel"]}
                  speed={44}
                  reactive={false}
                  separator={<OutlineStar />}
                  className="font-display text-[clamp(5rem,16vw,15rem)] leading-[0.95] opacity-[0.1] md:opacity-[0.13]"
                />
              </div>
            </div>
          </div>
          <div data-hero-logo-scroll="" className="relative">
            <div data-depth="-16">
              <div data-ambient="move" className="animate-logo-float [animation-delay:1.4s]">
                <div className="bfh-press">
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
                  <span aria-hidden className="bfh-contact" />
                  <span aria-hidden className="bfh-sheen-mask">
                    <span
                      data-ambient="move"
                      className="bfh-sheen animate-[sheen_calc(9s*var(--amb-k))_var(--ease-move)_650ms_infinite] motion-reduce:[animation-iteration-count:1]"
                    />
                  </span>
                </div>
                {/* Sello en el celular: abajo a la izquierda del logo, en el hueco que deja la estrella grande */}
                <div
                  aria-hidden
                  data-hero-badge-m=""
                  className="pointer-events-none absolute top-[calc(100%-34px)] left-[3%] md:hidden [@media(max-height:780px)]:hidden"
                >
                  <div className="bfh-badge">
                    <SpinningBadge text="hechas a mano por Bren · Lanús · " size={96} />
                  </div>
                </div>
                {STARS.map((star) => (
                  <div
                    key={star.left}
                    aria-hidden
                    data-hero-star=""
                    className="pointer-events-none absolute -translate-1/2"
                    style={{ left: star.left, top: star.top }}
                  >
                    <div
                      className="animate-pop-in motion-reduce:animate-fade-in"
                      style={{ animationDelay: `${star.delay}ms` }}
                    >
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
        </div>
      </div>

      {/* Copy + CTAs: sube desde .35 (CSS); al scrollear se va (GSAP, en el wrapper) */}
      <div data-hero-copy="" className="relative w-full">
        <div className="bfh-rise flex flex-col items-center text-center">
          <h1
            id="hero-title"
            className="font-display text-h3 text-ink mt-5 max-w-[21ch] text-balance md:mt-6"
          >
            {/* Corte en la coma: "soft gel" nunca se parte (W1) y "a tu talle." baja entero */}
            <span className="whitespace-nowrap">Press-on de soft gel,</span>{" "}
            <span className="whitespace-nowrap">
              <Brush mode="load">a tu talle</Brush>.
            </span>
          </h1>
          <p
            data-hero-lead=""
            className="text-lead text-ink-soft mt-3 max-w-[34ch] min-[380px]:text-balance md:max-w-[38ch]"
          >
            {/* Desde 380 px la primera oración va sola y la segunda se reparte en dos líneas parejas */}
            <span className="min-[380px]:block">Hechas a mano por Bren, listas para pegar.</span>{" "}
            Elegís del catálogo, armás el tuyo o nos pasás el diseño que viste.
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
        className="pointer-events-none absolute right-[clamp(16px,4vw,48px)] bottom-8 hidden lg:block"
      >
        <div className="bfh-badge">
          <SpinningBadge text="hechas a mano por Bren · Lanús · " size={140} />
        </div>
      </div>

      {/* Indicador: scroll (GSAP) › entrada (CSS) › rebote (ambiente) */}
      <div
        data-hero-cue=""
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="bfh-cue">
          <div data-ambient="move" className="animate-bounce-y">
            <Icon name="chevron" size={20} className="text-ink-soft block" />
          </div>
        </div>
      </div>
    </AmbientZone>
  );
}

/** Separador de la fila de contorno: la estrella del logo solo en contorno, con el mismo trazo que el texto. */
function OutlineStar() {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="size-[0.32em] shrink-0 overflow-visible">
      <path
        d={LOGO_STAR_PATH}
        fill="none"
        stroke="var(--bordo-900)"
        strokeWidth={1.25}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        transform="rotate(-12 50 50)"
      />
    </svg>
  );
}
