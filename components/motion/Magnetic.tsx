"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { MQ } from "@/lib/motion-core";

/** Recorrido máximo (px) en cada eje: el botón se asoma hacia el puntero, no lo persigue. */
const MAX = 10;

/**
 * Atrae suavemente un botón hacia el puntero (PLAN W2-A.8). Solo con mouse y sin reduced-motion; en el celular no
 * hace nada (y no deja estilos). Mientras el puntero está adentro sigue con `quickTo` (.35 s `power3.out`, hasta
 * ±10 px); al salir vuelve con un rebote elástico corto. El rect se mide al entrar (y de nuevo si la página
 * scrollea), nunca en cada movimiento.
 *
 * API estable (la usa BuilderCta): `strength` = fracción de la distancia al centro que se mueve.
 */
export function Magnetic({
  children,
  strength = 0.2,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia(MQ.reduced).matches) return;

    let center: { x: number; y: number } | null = null;
    let xTo: ((v: number) => void) | null = null;
    let yTo: ((v: number) => void) | null = null;

    // Centro en reposo: el rect incluye el corrimiento actual, así que se descuenta.
    const measure = () => {
      const r = el.getBoundingClientRect();
      center = {
        x: r.left + r.width / 2 - Number(gsap.getProperty(el, "x")),
        y: r.top + r.height / 2 - Number(gsap.getProperty(el, "y")),
      };
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      gsap.killTweensOf(el); // corta la vuelta elástica si estaba volviendo
      xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
      measure();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !xTo || !yTo) return;
      if (!center) measure();
      const c = center!;
      xTo(gsap.utils.clamp(-MAX, MAX, (e.clientX - c.x) * strength));
      yTo(gsap.utils.clamp(-MAX, MAX, (e.clientY - c.y) * strength));
    };
    const leave = () => {
      xTo = yTo = null;
      center = null;
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)", overwrite: true });
    };
    const stale = () => {
      center = null;
    };

    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", stale, { passive: true });
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", stale);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}
