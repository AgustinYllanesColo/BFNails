"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MQ } from "@/lib/motion-core";
import { LogoStar } from "@/components/brand/LogoStar";

/** Etiquetas de los `data-cursor` del sitio (cualquier otro valor se muestra tal cual). */
const LABELS: Record<string, string> = {
  ver: "Ver",
  armar: "Armar",
  sumar: "Sumar",
  wsp: "WhatsApp",
};

/** Distancia (px) de la píldora al puntero, y aire mínimo con los bordes de la ventana. */
const OFFSET = 16;
const EDGE = 8;
/** Sobre un campo de texto nunca aparece (estorba al escribir y tapa la selección). */
const FIELDS = "input, textarea, select, [contenteditable='true'], [contenteditable='']";

type State = "off" | "on" | "press";

/**
 * Cursor acompañante (PLAN W2-A.7). El cursor nativo se ve siempre: esto NO lo reemplaza. Una píldora amarilla con la
 * estrella del logo y la acción en MAYÚSCULAS ("VER", "ARMAR", "SUMAR") que acompaña al puntero a 16 px, solo
 * sobre elementos con `data-cursor`. Del lado de la pantalla que tenga lugar (nunca se corta contra un borde).
 *
 * - Sigue con `quickTo` de .12 s `power3.out` (con reduced-motion, pegada al puntero y solo funde).
 * - Aparece con escala .6 → 1 + opacidad en 200 ms `--ease-ui`; en `pointerdown` se va en 120 ms y no vuelve hasta
 *   que el puntero sale de ese elemento (no tapa el click ni lo que el click abre).
 * - Solo mouse/lápiz (con touch no hace nada). Al scrollear se recalcula qué hay debajo del puntero.
 *
 * Contrato con Providers (import dinámico): export `Cursor`, sin props.
 */
export function Cursor() {
  const outer = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const o = outer.current;
    const p = pill.current;
    const l = label.current;
    if (!o || !p || !l) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduced = window.matchMedia(MQ.reduced).matches;

    const xTo = reduced
      ? (v: number) => gsap.set(o, { x: v })
      : gsap.quickTo(o, "x", { duration: 0.12, ease: "power3.out" });
    const yTo = reduced
      ? (v: number) => gsap.set(o, { y: v })
      : gsap.quickTo(o, "y", { duration: 0.12, ease: "power3.out" });

    let pointer: { x: number; y: number } | null = null;
    let placed = false;
    let host: HTMLElement | null = null;
    let pressed: HTMLElement | null = null;
    let size = { w: 0, h: 0 };
    let raf = 0;

    const setState = (state: State) => {
      if (p.dataset.state !== state) p.dataset.state = state;
    };

    /** ¿Qué hay debajo del puntero? Decide si la píldora se ve y con qué texto. */
    const resolve = (target: Element | null) => {
      const next = target?.closest<HTMLElement>("[data-cursor]") ?? null;
      if (pressed && next !== pressed) pressed = null; // salió del elemento que se clickeó
      if (!next || !next.dataset.cursor || target?.closest(FIELDS) || next === pressed) {
        host = next;
        setState(pressed ? "press" : "off");
        return;
      }
      if (next !== host) {
        host = next;
        const key = next.dataset.cursor;
        l.textContent = LABELS[key] ?? key;
        size = { w: p.offsetWidth, h: p.offsetHeight }; // una lectura de layout por elemento, no por movimiento
      }
      setState("on");
    };

    /** A 16 px abajo a la derecha; si no entra, del otro lado (y la escala sale desde la esquina del puntero). */
    const place = (cx: number, cy: number) => {
      const flipX = cx + OFFSET + size.w > window.innerWidth - EDGE;
      const flipY = cy + OFFSET + size.h > window.innerHeight - EDGE;
      const x = flipX ? cx - OFFSET - size.w : cx + OFFSET;
      const y = flipY ? cy - OFFSET - size.h : cy + OFFSET;
      p.style.transformOrigin = `${flipX ? "right" : "left"} ${flipY ? "bottom" : "top"}`;
      if (!placed) {
        gsap.set(o, { x, y }); // la primera vez aparece donde está el puntero, sin viajar desde la esquina
        placed = true;
      } else {
        xTo(x);
        yTo(y);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY };
      resolve(e.target as Element | null);
      place(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !host) return;
      pressed = host;
      setState("press");
    };
    const onLeave = () => {
      host = null;
      pressed = null;
      setState("off");
    };
    // Lenis mueve la página debajo de un puntero quieto: recalcular qué quedó debajo (una vez por frame).
    const onScroll = () => {
      if (!pointer || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (pointer) resolve(document.elementFromPoint(pointer.x, pointer.y));
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onLeave);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      gsap.killTweensOf(o);
    };
  }, []);

  return (
    <div
      ref={outer}
      aria-hidden
      data-cursor-companion=""
      className="pointer-events-none fixed top-0 left-0 z-[100]"
    >
      <div
        ref={pill}
        data-state="off"
        className="bg-yellow rounded-pill text-ink flex scale-[0.6] items-center gap-1.5 px-2.5 py-1 text-[12px] leading-4 font-bold tracking-[0.08em] whitespace-nowrap uppercase opacity-0 shadow-sm transition-[opacity,scale] duration-[120ms] ease-[var(--ease-ui)] data-[state=on]:scale-100 data-[state=on]:opacity-100 data-[state=on]:duration-200 motion-reduce:scale-100"
      >
        <LogoStar size={10} tilt />
        <span ref={label} />
      </div>
    </div>
  );
}
