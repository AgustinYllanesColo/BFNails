"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/format";
import { useAmbientPause } from "@/lib/hooks";
import { MQ } from "@/lib/motion-core";
import { LogoStar } from "@/components/brand/LogoStar";

gsap.registerPlugin(ScrollTrigger);

export type StarSpec = {
  x: string;
  y: string;
  /** Lado en px desde md; en celulares se limita a 56 px. Composición en tríos 1 : .45 : .25. */
  size: number;
  /** Rotación fija (en su propio wrapper, nunca en el nodo que anima). */
  rotate?: number;
  /** Intensidad del parallax (1 = 120 px a lo largo de la sección). */
  speed?: number;
  /** Relleno. Siempre `--bordo-star` sobre crema (el default); se mantiene por compatibilidad. */
  color?: string;
  /** `false` la oculta en celulares. */
  mobile?: boolean;
};

/** Trío del logo (1 : .45 : .25): una grande, una mediana y una chica; nunca más de tres por viewport. */
const DEFAULT: StarSpec[] = [
  { x: "78%", y: "16%", size: 112, rotate: 10, speed: 0.6 },
  { x: "5%", y: "64%", size: 50, rotate: -14, speed: 1 },
  { x: "70%", y: "82%", size: 28, rotate: 18, speed: 1.4 },
];

/**
 * Estrellas del logo de fondo (PLAN F3.5, DESIGN §6.1). Cuatro nodos por estrella, uno por responsabilidad:
 * posición + parallax de scroll (GSAP, solo sin reduced-motion) › rotación fija › respiración CSS
 * (`breathe`, `data-ambient="move"`, atenuada por `--br-s`/`--amb-k` con reduced-motion) › la estrella.
 *
 * El parallax se mide desde la posición de scroll en que se montó, así nada salta al hidratar aunque la sección ya
 * esté en pantalla. Fuera de vista la respiración se pausa (`useAmbientPause`). Decorativas: `aria-hidden`; el que
 * las usa deja 12 px de aire con el texto y nunca las pone detrás de texto bordó.
 */
export function Stars({ stars = DEFAULT, className }: { stars?: StarSpec[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useAmbientPause(ref);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MQ.full, () => {
      const nodes = gsap.utils.toArray<HTMLElement>("[data-star]", el);
      const movers = nodes.map((node, i) => ({
        speed: Number(node.dataset.speed ?? 1),
        dir: i % 2 ? -1 : 1,
        yTo: gsap.quickTo(node, "y", { duration: 0.6, ease: "power3.out" }),
        rTo: gsap.quickTo(node, "rotation", { duration: 0.6, ease: "power3.out" }),
      }));
      let p0: number | null = null;
      const move = (p: number) => {
        if (p0 === null) p0 = p;
        const d = p - p0;
        for (const m of movers) {
          m.yTo(d * -120 * m.speed);
          m.rTo(d * 16 * m.dir);
        }
      };
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => move(self.progress),
      });
      p0 = st.progress;
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          data-star=""
          data-speed={s.speed ?? 1}
          className={cn("absolute", s.mobile === false && "hidden md:block")}
          style={{ left: s.x, top: s.y }}
        >
          <div style={{ transform: `rotate(${s.rotate ?? 0}deg)` }}>
            <span
              data-ambient="move"
              className="block size-[min(var(--s),56px)] md:size-[var(--s)]"
              style={
                {
                  "--s": `${s.size}px`,
                  animation: `breathe calc(${(2.4 + i * 0.3).toFixed(1)}s * var(--amb-k)) ease-in-out ${(-i * 0.7).toFixed(1)}s infinite alternate`,
                } as CSSProperties
              }
            >
              <LogoStar size={s.size} fill={s.color} tilt className="size-full" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
