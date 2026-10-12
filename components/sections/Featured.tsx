"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Design } from "@/lib/types";
import { DesignCard } from "@/components/catalog/DesignCard";
import { Brush } from "@/components/motion/Brush";
import { Heading, Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { MQ, isInViewportNow, registerEases } from "@/lib/motion";
import "./home.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Inclinación de cada tarjeta del abanico antes de "apoyarse" (se repite cada cuatro). */
const FAN = [-7, 5, -4, 6];

const SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 72vw";

/**
 * Destacados (PLAN §4 W2-B.3). En el celular es un carril con snap (72vw por tarjeta, la siguiente asoma) y un
 * indicador de cuánto queda; desde md, una grilla (4 columnas en lg, las pares bajadas 48 px).
 *
 * Entrada (solo si al montar no está en pantalla):
 * - < md: las dos primeras tarjetas entran deslizándose desde la derecha (el abanico se recortaría contra el carril).
 * - ≥ md: abanico "press-on": cada tarjeta llega inclinada y un poco chica, se apoya con un rebote corto y, al
 *   asentarse, un brillo de top coat la barre una vez (motivo "se aplica y brilla").
 * - Reduced-motion: solo opacidad, 300 ms.
 *
 * Un nodo por responsabilidad: el `<li>` lleva el desnivel estático de lg; `[data-card]` lo anima GSAP; la capa
 * `.sheen` corre el brillo por CSS cuando `[data-card]` recibe `data-sheen="1"`.
 */
export function Featured({ designs }: { designs: Design[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  // Indicador del carril móvil: el ancho es la parte visible y la posición, lo recorrido (scroll pasivo + rAF).
  useEffect(() => {
    const el = rail.current;
    const bar = thumb.current;
    if (!el || !bar) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const visible = el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1;
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0;
      bar.style.width = `${(visible * 100).toFixed(2)}%`;
      bar.style.transform = `translateX(${((p * (1 - visible)) / visible) * 100}%)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [designs.length]);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    registerEases();
    const mm = gsap.matchMedia();
    mm.add(
      {
        mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        desk: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        reduced: MQ.reduced,
      },
      (ctx) => {
        const { mobile, desk } = ctx.conditions as Record<string, boolean>;
        // Nunca esconder lo que ya se ve (recarga a mitad de página, vuelta atrás).
        if (isInViewportNow(el)) return;
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]", el);
        if (!cards.length) return;
        const shine = function (this: gsap.core.Tween) {
          const card = this.targets()[0] as HTMLElement | undefined;
          if (card) card.dataset.sheen = "1";
        };
        const done = "transform,opacity,visibility";

        if (mobile) {
          const first = cards.slice(0, 2);
          gsap.set(first, { x: 48, autoAlpha: 0 });
          gsap.to(first, {
            x: 0,
            autoAlpha: 1,
            duration: 0.6,
            ease: "bf.expo",
            stagger: { each: 0.06, onComplete: shine },
            clearProps: done,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
          return;
        }

        if (desk) {
          gsap.set(cards, {
            y: 70,
            rotate: (i: number) => FAN[i % FAN.length],
            scale: 0.92,
            autoAlpha: 0,
            transformOrigin: "50% 100%",
          });
          gsap.to(cards, {
            y: 0,
            rotate: 0,
            scale: 1,
            autoAlpha: 1,
            duration: 0.85,
            ease: "back.out(1.6)",
            stagger: { each: 0.07, onComplete: shine },
            clearProps: done,
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
          });
          return;
        }

        // reduced-motion: aparecen, sin recorrido ni brillo
        gsap.set(cards, { autoAlpha: 0 });
        gsap.to(cards, {
          autoAlpha: 1,
          duration: 0.3,
          ease: "power1.out",
          stagger: 0.04,
          clearProps: "opacity,visibility",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      },
    );
    return () => mm.revert();
  }, []);

  return (
    <Section id="destacados">
      <div className="container-x">
        <div className="flex items-end justify-between gap-6">
          <Heading reveal>
            Sets que <Brush mode="scrub">vuelan</Brush>
          </Heading>
          <Link
            href="/catalogo"
            data-cursor="ver"
            className="group text-bordo rounded-pill mb-2 hidden min-h-11 shrink-0 items-center gap-2 px-1 text-[15px] font-semibold md:inline-flex"
          >
            Ver todo el catálogo
            <Icon
              name="arrow"
              size={18}
              className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="mt-[var(--stack-heading)]">
          <ul
            ref={rail}
            aria-label="Sets destacados"
            className="-mx-[var(--gutter)] -my-4 grid auto-cols-[72vw] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-px-[var(--gutter)] px-[var(--gutter)] py-4 [scrollbar-width:none] snap-x snap-mandatory sm:auto-cols-[46vw] md:mx-0 md:my-0 md:auto-cols-auto md:grid-flow-row md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-4 lg:pb-12 [&::-webkit-scrollbar]:hidden lg:[&>li:nth-child(even)]:translate-y-12"
          >
            {designs.map((d) => (
              <li key={d.slug} className="min-w-0 snap-start">
                <div data-card="" className="relative">
                  <span aria-hidden className="bfhs-sheen" />
                  <DesignCard design={d} sizes={SIZES} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Cuánto queda del carril (solo el celular lo necesita) */}
        <div aria-hidden className="bg-bordo/15 rounded-pill mt-5 h-[3px] overflow-hidden md:hidden">
          <span
            ref={thumb}
            className="bg-bordo rounded-pill block h-full w-1/4"
          />
        </div>

        <div className="mt-8 md:hidden">
          <Button href="/catalogo" variant="secondary" size="lg" className="w-full" data-cursor="ver">
            Ver todo el catálogo
          </Button>
        </div>
      </div>
    </Section>
  );
}
