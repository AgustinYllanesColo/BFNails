"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/format";

gsap.registerPlugin(ScrollTrigger);

/**
 * Trazo de la pincelada (viewBox 200 × 20, estirado al ancho de la palabra). Arranca en x = 8: con la punta redonda
 * (radio 6) el borde izquierdo cae ~1 % adentro de la palabra y nunca tapa el espacio con la anterior ("precio al
 * instante" no subraya "precio"). A la derecha sí se pasa (~5 %): es el remate de la pincelada.
 */
const STROKE_D = "M8 12 C 44 4, 82 16, 120 9 S 185 13, 197 7";

/** Largo máximo de la palabra acento (PLAN §2.6): la pincelada no corta línea y a 360 px no entra más. */
export const BRUSH_MAX_CHARS = 14;
/** Textos ya avisados (el aviso de desarrollo sale una vez por texto, no en cada render). */
const warned = new Set<string>();

type Props = {
  /** La palabra acento: ≤ 14 caracteres (no corta línea; en desarrollo avisa por consola si se pasa). */
  children: ReactNode;
  /**
   * `light` sobre crema: texto bordó, esmalte rojo moño al 22 % (rosado). `inverse` sobre bordó: texto amarillo,
   * esmalte rojo moño al 60 % (el tono crema/leopardo del borrador se leía como una mancha marrón sobre el bordó).
   */
  tone?: "light" | "inverse";
  /**
   * `scrub`: se pinta con el scroll del titular · `view`: se pinta una vez al entrar en vista · `load`: se pinta al
   * cargar (solo h1 del primer viewport) · `static`: ya pintada.
   */
  mode?: "scrub" | "view" | "load" | "static";
  className?: string;
};

/*
 * Geometría de los trazos (verificada en Chromium):
 * - Esmalte: `pathLength=1`, `dasharray="1 1.1"`. Con `dasharray="1"` (gap = largo) el guion siguiente toca el final
 *   del trazo y la punta redonda dibuja un punto aunque la pincelada esté "sin pintar".
 * - Brillo (top coat): `pathLength=.9` y `dasharray="0 .9 .08 3"`, puntas planas. Con el mismo `brush-draw`
 *   (offset 1 → 0) el destello entra por la izquierda, recorre la pincelada y sale por la derecha: queda invisible en
 *   reposo, antes y después de pasar.
 */
// Clases literales completas: Tailwind solo genera lo que encuentra escrito tal cual en el código.
const STROKE_BASE = "[stroke-dasharray:1_1.1] [stroke-dashoffset:1]";
const SHINE_BASE = "[stroke-dasharray:0_0.9_0.08_3] [stroke-dashoffset:1]";

const STROKE_MODE: Record<NonNullable<Props["mode"]>, string> = {
  scrub: "",
  view: "group-data-[drawn=1]/brush:animate-[brush-draw_700ms_var(--ease-move)_both]",
  load: "animate-[brush-draw_700ms_var(--ease-move)_300ms_both]",
  static: "[stroke-dashoffset:0]",
};

const SHINE_MODE: Record<NonNullable<Props["mode"]>, string> = {
  scrub: "group-data-[shine=1]/brush:animate-[brush-draw_700ms_var(--ease-move)_both]",
  view: "group-data-[drawn=1]/brush:animate-[brush-draw_700ms_var(--ease-move)_700ms_both]",
  load: "animate-[brush-draw_700ms_var(--ease-move)_1000ms_both]",
  static: "hidden",
};

/**
 * Pincelada de esmalte bajo la palabra acento del titular (PLAN F3.3, §2.6): una por titular. El motivo "se aplica y
 * brilla": el esmalte se pinta y después un destello de top coat lo recorre una vez.
 *
 * - `scrub`: GSAP pinta el trazo con el scroll del titular (`top 80%` → `top 50%`, sin redondear: a mitad de camino
 *   está a mitad de pintar); cuando el trazo termina de pintarse por primera vez la raíz recibe `data-shine="1"`
 *   (atributo de DOM, no estado) y el CSS corre el brillo.
 * - `view`: un IntersectionObserver (una vez, umbral .6) pone `data-drawn="1"`: pintado 700 ms + brillo.
 * - `load`: CSS puro desde el primer paint (300 ms de demora), sin esperar a hidratar.
 * - `static` y reduced-motion: ya pintada, sin brillo.
 *
 * La pincelada es decoración: el texto nunca se esconde ni se mueve.
 */
export function Brush({ children, tone = "light", mode = "scrub", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  // Aviso de desarrollo: con `whitespace-nowrap` una frase larga no corta línea y desborda el renglón en celulares.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const text = ref.current?.textContent?.trim() ?? "";
    const length = [...text].length;
    if (length <= BRUSH_MAX_CHARS || warned.has(text)) return;
    warned.add(text);
    console.warn(
      `[Brush] "${text}" tiene ${length} caracteres (máximo ${BRUSH_MAX_CHARS}): la pincelada no corta línea y ` +
        "desborda el renglón a 360–390 px. Dejá la pincelada en una o dos palabras del titular.",
    );
  }, [children]);

  useEffect(() => {
    const el = ref.current;
    if (!el || mode === "static" || mode === "load") return;

    if (mode === "view") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          el.dataset.drawn = "1";
          io.disconnect();
        },
        { threshold: 0.6 },
      );
      io.observe(el);
      return () => io.disconnect();
    }

    // scrub
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const stroke = el.querySelector<SVGPathElement>("[data-stroke]");
      if (!stroke) return;
      gsap.fromTo(
        stroke,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          // El trazo mide 1 (pathLength): con el redondeo a px por defecto de GSAP todo valor intermedio quedaba en
          // 1px o 0px y la pincelada aparecía de golpe a mitad de camino en vez de pintarse con el scroll.
          autoRound: false,
          // El brillo sale del progreso del propio tween, no del scroll: con `scrub` el trazo llega a 1 ~.6 s
          // después que el scroll, y el destello tiene que pasar sobre la pincelada ya completa.
          onUpdate(this: gsap.core.Tween) {
            if (this.progress() > 0.995 && !el.dataset.shine) el.dataset.shine = "1";
          },
          scrollTrigger: {
            trigger: el.closest("h1, h2, h3") ?? el,
            start: "top 80%",
            end: "top 50%",
            scrub: 0.6,
          },
        },
      );
    });
    return () => mm.revert();
  }, [mode]);

  const inverse = tone === "inverse";
  return (
    <span
      ref={ref}
      data-brush={mode}
      className={cn(
        "group/brush relative inline-block whitespace-nowrap",
        inverse ? "text-yellow" : "text-bordo",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-[0.02em] left-0 h-[0.34em] w-[104%] overflow-visible"
      >
        <path
          data-stroke=""
          d={STROKE_D}
          pathLength={1}
          fill="none"
          stroke={inverse ? "rgb(181 28 28 / 0.6)" : "rgb(181 28 28 / 0.22)"}
          strokeWidth={12}
          strokeLinecap="round"
          className={cn(
            STROKE_BASE,
            STROKE_MODE[mode],
            "motion-reduce:animate-none! motion-reduce:[stroke-dashoffset:0]!",
          )}
        />
        <path
          data-shine=""
          d={STROKE_D}
          pathLength={0.9}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          opacity={0.45}
          className={cn(SHINE_BASE, SHINE_MODE[mode], "motion-reduce:hidden!")}
        />
      </svg>
      <span className="relative z-[1]">{children}</span>
    </span>
  );
}
