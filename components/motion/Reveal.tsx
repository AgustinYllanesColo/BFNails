"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/format";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Anima cada hijo directo con stagger en lugar del contenedor */
  stagger?: number;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "ul" | "li" | "span" | "p" | "h1" | "h2" | "h3";
};

export function Reveal({
  children,
  className,
  stagger,
  delay = 0,
  y = 24,
  once = true,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Lo que ya está en pantalla (o más arriba, si se recargó a mitad de página) queda como vino del servidor:
    // esconderlo al hidratar y volver a mostrarlo hacía que la página pareciera trabada.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    const mm = gsap.matchMedia();
    mm.add("all", () => {
      const targets = stagger != null ? Array.from(el.children) : el;
      gsap.set(targets, { autoAlpha: 0, y });
      const tween = gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
        delay,
        stagger: stagger ?? 0,
        // al terminar se limpia el transform: un texto que queda en una capa transformada se ve borroso
        clearProps: "transform,willChange",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: once ? "play none none none" : "play none none reverse",
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    return () => mm.revert();
  }, [stagger, delay, y, once]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any;
  return (
    <Comp ref={ref} className={cn(className)}>
      {children}
    </Comp>
  );
}
