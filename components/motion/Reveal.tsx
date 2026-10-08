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
  y = 40,
  once = true,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("all", () => {
      const targets = stagger != null ? Array.from(el.children) : el;
      gsap.set(targets, { autoAlpha: 0, y });
      const tween = gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        delay,
        stagger: stagger ?? 0,
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
