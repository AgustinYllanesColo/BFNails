"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Cursor estrella: sigue al mouse con lerp, crece sobre elementos interactivos
 * y muestra un texto cuando el elemento tiene data-cursor="texto".
 * Solo se activa con puntero fino y sin prefers-reduced-motion.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!fine || reduced || !el) return;

    document.documentElement.classList.add("has-cursor");
    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });

    let shown = false;
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      if (!shown) {
        shown = true;
        gsap.to(el, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" });
      }
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "a, button, [role=button], input, select, textarea, label, [data-cursor]",
      );
      const text = target?.dataset.cursor;
      if (label.current) label.current.textContent = text ?? "";
      el.dataset.state = text ? "label" : target ? "hover" : "idle";
    };
    const leave = () => gsap.to(el, { scale: 0, opacity: 0, duration: 0.3 });
    const enter = () => gsap.to(el, { scale: 1, opacity: 1, duration: 0.3 });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-state="idle"
      className="group cursor-root pointer-events-none fixed top-0 left-0 z-[100]"
      style={{ willChange: "transform" }}
    >
      <div className="relative grid place-items-center transition-transform duration-300 ease-[var(--ease-bounce)] group-data-[state=hover]:scale-[2.2] group-data-[state=label]:scale-[3.2]">
        <svg width="22" height="22" viewBox="0 0 24 24" className="animate-[spin-slow_9s_linear_infinite] drop-shadow">
          <path
            d="M12 1.5l2.9 7.1 7.6.5-5.9 4.9 1.9 7.4L12 17.3 5.5 21.4l1.9-7.4L1.5 9.1l7.6-.5z"
            fill="var(--bordo)"
          />
        </svg>
        <span
          ref={label}
          className="absolute text-[4px] font-semibold tracking-wide text-cream uppercase opacity-0 transition-opacity group-data-[state=label]:opacity-100"
        />
      </div>
    </div>
  );
}
