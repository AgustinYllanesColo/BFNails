"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Magnetic } from "@/components/motion/Magnetic";
import { MouseParallax } from "@/components/motion/MouseParallax";
import { SpinningBadge } from "@/components/motion/SpinningBadge";
import { Star } from "@/components/motion/Marquee";
import { Button } from "@/components/ui/Button";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero: lockup del logo a pantalla completa. "nails" gigante en Shrikhand,
 * estrellas bordó grandes como en el logo, Kitty flotando y un badge que gira.
 * Intro con timeline (estrellas → letras → Kitty → texto) y parallax de mouse
 * y de scroll.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(q("[data-hero-star]"), { scale: 0, rotate: -90, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1.4, stagger: 0.08, ease: "back.out(1.8)" }, 0);
      tl.fromTo(q("[data-hero-letter]"), { yPercent: 120, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.06 }, 0.25);
      tl.fromTo(q("[data-hero-studio]"), { x: -16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9 }, 0.9);
      tl.fromTo(q("[data-hero-kitty]"), { scale: 0.5, rotate: -16, autoAlpha: 0, y: 60 }, { scale: 1, rotate: 0, autoAlpha: 1, y: 0, duration: 1.5, ease: "back.out(1.4)" }, 0.6);
      tl.fromTo(q("[data-hero-copy] > *"), { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.1 }, 1.1);
      tl.fromTo(q("[data-hero-badge]"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1, ease: "back.out(2)" }, 1.3);
      tl.fromTo(q("[data-hero-cue]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.8);

      // Flotación continua
      gsap.to(q("[data-hero-kitty]"), { y: -16, rotate: 3, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2.1 });
      q("[data-hero-star]").forEach((s, i) => {
        gsap.to(s, { rotate: `+=${i % 2 ? 14 : -10}`, y: `-=${8 + i * 3}`, duration: 3.5 + i * 0.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2 });
      });

      // Parallax de scroll: el lockup se va yendo más lento que la página
      gsap.to(q("[data-hero-lockup]"), { yPercent: 18, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.5 } });
      gsap.to(q("[data-hero-kitty]"), { yPercent: 35, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.5 } });
    });
    return () => mm.revert();
  }, []);

  const letters = Array.from("nails");

  return (
    <section ref={root} className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-10 md:pt-28">
      {/* Fondo: halo suave y textura leopardo muy sutil */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute top-[20%] left-1/2 size-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,167,195,0.22)_0%,rgba(254,247,231,0)_62%)] animate-[float_9s_ease-in-out_infinite]" />
        <div className="absolute right-[-10%] bottom-[-10%] size-[60vw] max-w-[640px] rounded-full leopard-bg opacity-[0.07] [mask-image:radial-gradient(circle,black_30%,transparent_70%)]" />
      </div>

      <MouseParallax className="container-x relative" range={36}>
        <div data-hero-lockup className="relative mx-auto w-full max-w-[1200px]">
          {/* Estrellas como en el logo */}
          {/* Como en el logo: una estrella grande detrás de la "n", otra detrás de la "s" */}
          <div data-hero-star data-depth="0.9" className="absolute top-[-22%] left-[-6%] -z-10 text-bordo md:top-[-10%] md:left-[-3%]" style={{ willChange: "transform" }}>
            <Star size={200} className="size-[30vw] max-w-[300px] md:size-[19vw]" />
          </div>
          <div data-hero-star data-depth="1.3" className="absolute top-[-34%] left-[14%] text-bordo md:top-[-22%] md:left-[16%]" style={{ willChange: "transform" }}>
            <Star size={70} className="size-[9vw] max-w-[90px]" />
          </div>
          <div data-hero-star data-depth="0.7" className="absolute right-[-4%] bottom-[-8%] -z-10 text-bordo md:right-[1%] md:bottom-[2%]" style={{ willChange: "transform" }}>
            <Star size={150} className="size-[22vw] max-w-[230px] md:size-[15vw]" />
          </div>
          <div data-hero-star data-depth="1.6" className="absolute top-[-30%] right-[8%] text-red md:top-[-18%] md:right-[24%]" style={{ willChange: "transform" }}>
            <Star size={50} className="size-[6vw] max-w-[60px]" />
          </div>

          {/* Wordmark */}
          <div className="relative flex items-end justify-center">
            <span data-hero-studio className="absolute top-[-4%] right-[2%] font-sans text-[clamp(0.7rem,1.5vw,1.3rem)] font-bold tracking-[0.24em] text-ink uppercase md:right-[4%]">
              BF Studio
            </span>
            <h1 className="font-display leading-[0.8] text-ink text-[clamp(6rem,30vw,22rem)]" aria-label="nails, BF Studio">
              <span className="sr-only">nails</span>
              {letters.map((ch, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden>
                  <span data-hero-letter className="inline-block will-change-transform" style={{ textShadow: "0 0 0 transparent" }}>
                    {ch}
                  </span>
                </span>
              ))}
            </h1>
          </div>

          {/* Kitty */}
          <div data-hero-kitty data-depth="0.5" className="absolute right-[-2%] bottom-[-34%] w-[22vw] max-w-[260px] md:right-[6%] md:bottom-[-42%] md:w-[15vw]" style={{ willChange: "transform" }}>
            <Image src="/brand/kitty.webp" alt="Kitty de BF Studio con orejas de leopardo guiñando" width={508} height={600} priority fetchPriority="high" sizes="(min-width: 768px) 16vw, 26vw" className="w-full " />
          </div>
        </div>

        {/* Copy + CTAs */}
        <div data-hero-copy className="relative mx-auto mt-[16vw] max-w-xl text-center md:mt-[9vw]">
          <p className="text-xs font-bold tracking-[0.22em] text-bordo uppercase">Press-on en soft gel · hechas a mano en Lanús</p>
          <p className="mt-4 text-balance text-lg leading-relaxed text-ink-soft md:text-xl">
            Uñas a tu talle, listas para pegar. Elegís un set del catálogo, armás el tuyo o nos pasás el diseño que viste en internet.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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

        <div data-hero-badge className="absolute bottom-0 left-0 hidden md:block">
          <SpinningBadge text="press-on · soft gel · a tu talle · " size={150} />
        </div>
      </MouseParallax>

      <div data-hero-cue aria-hidden className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-ink-soft uppercase">
        deslizá
        <span className="block h-10 w-px overflow-hidden bg-bordo/15">
          <span className="block h-1/2 w-full bg-bordo animate-[cue_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}
