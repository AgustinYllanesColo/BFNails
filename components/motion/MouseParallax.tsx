"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Mueve cada hijo con data-depth según la posición del mouse (parallax).
 * depth 0 = quieto, 1 = se mueve hasta `range` px. Solo con puntero fino.
 */
export function MouseParallax({ children, className, range = 40 }: { children: React.ReactNode; className?: string; range?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]")).map((node) => ({
      node,
      depth: Number(node.dataset.depth ?? 0.3),
      xTo: gsap.quickTo(node, "x", { duration: 1.2, ease: "power3.out" }),
      yTo: gsap.quickTo(node, "y", { duration: 1.2, ease: "power3.out" }),
    }));
    const move = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      layers.forEach((l) => {
        l.xTo(nx * range * l.depth);
        l.yTo(ny * range * l.depth);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [range]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
