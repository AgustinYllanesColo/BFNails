"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "./Marquee";

gsap.registerPlugin(ScrollTrigger);

type StarSpec = { x: string; y: string; size: number; rotate?: number; speed?: number; color?: string; mobile?: boolean };

const DEFAULT: StarSpec[] = [
  { x: "-3%", y: "4%", size: 140, rotate: -12, speed: 0.6, mobile: false },
  { x: "80%", y: "8%", size: 60, rotate: 15, speed: 1.2 },
  { x: "88%", y: "62%", size: 110, rotate: 8, speed: 0.9 },
  { x: "18%", y: "78%", size: 44, rotate: 30, speed: 1.4, color: "var(--red)", mobile: false },
  { x: "60%", y: "88%", size: 70, rotate: -25, speed: 0.8 },
];

/** Estrellas bordó decorativas que flotan y reaccionan al scroll con parallax. */
export function Stars({ stars = DEFAULT, className }: { stars?: StarSpec[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("all", () => {
      const nodes = el.querySelectorAll<HTMLElement>("[data-star]");
      nodes.forEach((node, i) => {
        const speed = Number(node.dataset.speed ?? 1);
        gsap.to(node, {
          y: -120 * speed,
          rotate: `+=${20 * (i % 2 ? -1 : 1)}`,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
        gsap.to(node, {
          scale: 1.08,
          duration: 2.4 + i * 0.3,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {stars.map((s, i) => (
        <div
          key={i}
          data-star
          data-speed={s.speed ?? 1}
          className={s.mobile === false ? "absolute hidden md:block" : "absolute"}
          style={{
            left: s.x,
            top: s.y,
            transform: `rotate(${s.rotate ?? 0}deg)`,
            color: s.color ?? "var(--bordo)",
            willChange: "transform",
          }}
        >
          <Star size={s.size} />
        </div>
      ))}
    </div>
  );
}
