"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Magnetic } from "@/components/motion/Magnetic";
import { HeroPhotos } from "@/components/motion/HeroPhotos";
import { Button } from "@/components/ui/Button";

/**
 * Hero: el logo real de BF Studio, grande y centrado, sobre un halo cálido, con fotos reales de sets
 * alrededor como stickers. Una sola intro corta (logo, fotos, copy) y después nada corre por
 * cuadro: ni filas de texto en movimiento ni parallax atado al scroll. Lo único vivo es una
 * flotación suave del logo, en CSS.
 *
 * Vida sin peso (todo transform/opacity, en CSS salvo el mouse): las fotos se reparten desde el logo y flotan
 * cada una a su ritmo, un brillo de top coat barre el logo cada ~7 s, el titular rota lo que vende y, con
 * mouse, logo y fotos se corren a distinta profundidad.
 *
 * La intro es CSS (`hero-in-*` en globals.css) y arranca desde el primer cuadro pintado: con GSAP el
 * contenido llegaba visible del servidor, se escondía al hidratar y volvía a aparecer (parpadeo al recargar).
 */
/** Lo que vende, en el orden en que se lee: una por vez detrás de "Press-on". */
const WORDS = ["personalizadas", "a tu talle", "hechas a mano", "reutilizables"];
const WORD_MS = 2600;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [word, setWord] = useState(0);

  // Titular: cambia de palabra cada 2,6 s (no con reduced-motion ni con la pestaña oculta)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setWord((w) => (w + 1) % WORDS.length);
    }, WORD_MS);
    return () => window.clearInterval(id);
  }, []);

  // Profundidad con el mouse (solo puntero fino): cada [data-depth] se corre proporcional a su número.
  // quickTo: una sola curva interrumpible por capa, sin tweens acumulados.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches)
      return;
    const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", el).map((n) => {
      const d = Number(n.dataset.depth) || 0;
      return {
        d,
        x: gsap.quickTo(n, "x", { duration: 1, ease: "power3.out" }),
        y: gsap.quickTo(n, "y", { duration: 1, ease: "power3.out" }),
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
    const leave = () => layers.forEach((l) => (l.x(0), l.y(0)));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[86svh] flex-col items-center justify-center overflow-hidden pt-24 pb-20 md:min-h-[100svh] md:pt-28 md:pb-28"
    >
      {/* Fondo: halo cálido, estático */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute top-1/2 left-1/2 size-[90vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,167,195,0.3)_0%,rgba(201,160,99,0.12)_38%,rgba(254,247,231,0)_66%)]" />
      </div>
      <HeroPhotos className="-z-10" />

      {/* Logo real: flota apenas, en CSS */}
      <div data-hero-logo className="hero-in-logo relative z-10 w-[min(88vw,760px)]">
        <div data-depth="14">
          <div className="relative motion-safe:animate-[float_7s_ease-in-out_infinite]">
            <Image
              src="/brand/logo-nails.webp"
              alt="BF Studio nails"
              width={960}
              height={580}
              preload
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 768px) 760px, 88vw"
              className="w-full drop-shadow-[0_30px_50px_rgba(74,14,14,0.22)]"
            />
            <span aria-hidden className="hero-sheen-mask">
              <span className="hero-sheen" />
            </span>
          </div>
        </div>
      </div>

      {/* Copy + CTAs */}
      <div data-hero-copy className="hero-in-copy relative mt-6 max-w-xl px-5 text-center md:mt-8">
        <h1 className="font-display text-ink text-4xl md:text-5xl">
          <span className="sr-only">
            Press-on personalizadas, a tu talle, hechas a mano y reutilizables
          </span>
          <span aria-hidden>
            Press-on{" "}
            {/* Todas las palabras apiladas en la misma celda: el ancho es el de la más larga y nada salta */}
            <span className="grid overflow-hidden pb-[0.12em] text-center">
              {WORDS.map((w, i) => (
                <span
                  key={i === word ? `${w}-on` : w}
                  className={
                    i === word
                      ? "text-bordo hero-word [grid-area:1/1]"
                      : "invisible [grid-area:1/1]"
                  }
                >
                  {w}
                </span>
              ))}
            </span>
          </span>
        </h1>
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
        data-hero-cue
        aria-hidden
        className="hero-in-cue text-ink-soft absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase"
      >
        deslizá
        <span className="bg-bordo/15 block h-10 w-px overflow-hidden">
          <span className="bg-bordo block h-1/2 w-full animate-[cue_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}
