"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/format";

type Props = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  stagger?: number;
  /** "chars" revela letra por letra, "words" palabra por palabra */
  by?: "chars" | "words";
};

/** Reveal tipográfico: cada unidad sube desde abajo con máscara (overflow hidden). */
export function SplitText({
  text,
  className,
  as: Tag = "h1",
  delay = 0,
  stagger = 0.035,
  by = "chars",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const units = el.querySelectorAll<HTMLElement>("[data-unit]");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(units, { yPercent: 110, rotate: 4 });
      gsap.to(units, {
        yPercent: 0,
        rotate: 0,
        duration: 1.2,
        ease: "expo.out",
        delay,
        stagger,
      });
    });
    return () => mm.revert();
  }, [delay, stagger, text]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any;
  return (
    <Comp ref={ref} className={cn("inline-block", className)} aria-label={text}>
      {words.map((word, wi) => (
        <span
          key={wi}
          className={cn("inline-block overflow-hidden pb-[0.12em] align-bottom", wi < words.length - 1 && "mr-[0.22em]")}
          aria-hidden
        >
          {by === "words" ? (
            <span data-unit className="inline-block will-change-transform">
              {word}
            </span>
          ) : (
            Array.from(word).map((ch, ci) => (
              <span key={ci} data-unit className="inline-block will-change-transform">
                {ch}
              </span>
            ))
          )}
        </span>
      ))}
    </Comp>
  );
}
