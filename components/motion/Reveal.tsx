"use client";

import { useEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MQ, isInViewportNow, registerEases } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type Tag =
  "div" | "section" | "ul" | "ol" | "li" | "span" | "p" | "h1" | "h2" | "h3" | "article" | "header";

type Props = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  children: ReactNode;
  className?: string;
  /** Anima cada hijo directo con este escalonado (s) en lugar del contenedor entero. */
  stagger?: number;
  /** Demora de la entrada (s). */
  delay?: number;
  /** Recorrido vertical en px (sin efecto con reduced-motion, que entra solo con opacidad). */
  y?: number;
  /** Con `false`, la entrada se deshace al volver a subir por encima del disparador. */
  once?: boolean;
  as?: Tag;
};

/**
 * Entrada de marketing al scrollear (PLAN F3.1): sube 24 px y aparece en .8 s con `bf.expo` cuando el borde superior
 * cruza el 88 % del viewport. Con reduced-motion, solo opacidad en .4 s.
 *
 * Nunca esconde lo que ya se ve: si al hidratar el bloque está en pantalla, queda tal cual (sin parpadeo). Lo que está
 * fuera de vista se oculta recién después de hidratar, donde nadie lo ve. No depende de la pausa manual (GSAP no se
 * pausa nunca), así que nada puede quedar invisible. Al terminar limpia sus estilos en línea.
 */
export function Reveal({
  children,
  className,
  stagger,
  delay = 0,
  y = 24,
  once = true,
  as = "div",
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerEases();
    const mm = gsap.matchMedia();
    mm.add(MQ, (ctx) => {
      const { reduced } = ctx.conditions as { full: boolean; reduced: boolean };
      if (isInViewportNow(el)) return;
      const targets = stagger != null ? gsap.utils.toArray<HTMLElement>(el.children) : [el];
      if (targets.length === 0) return;
      gsap.set(targets, { autoAlpha: 0, y: reduced ? 0 : y });
      gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: reduced ? 0.4 : 0.8,
        ease: "bf.expo",
        delay,
        stagger: stagger ?? 0,
        clearProps: once ? "opacity,visibility,transform" : undefined,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once,
          toggleActions: once ? "play none none none" : "play none none reverse",
        },
      });
    });
    return () => mm.revert();
  }, [stagger, delay, y, once]);

  const Comp = as as ElementType;
  return (
    <Comp ref={ref} data-reveal="" className={className} {...rest}>
      {children}
    </Comp>
  );
}
