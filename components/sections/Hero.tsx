"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Stars } from "@/components/motion/Stars";
import { SplitText } from "@/components/motion/SplitText";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/Button";
import { Star } from "@/components/motion/Marquee";

export function Hero() {
  const kitty = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(kitty.current, { scale: 0.6, rotate: -14, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1.4, ease: "back.out(1.6)" }, 0.2);
      tl.fromTo(sub.current?.children ?? [], { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08 }, 0.9);
      gsap.to(kitty.current, { y: -14, rotate: 3, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.6 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <Stars />
      <div className="container-x relative grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
        <div className="relative z-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-pill bg-cream-deep px-4 py-2 text-xs font-bold tracking-[0.18em] text-bordo uppercase ring-1 ring-bordo/10">
            <Star size={12} className="text-red" /> Press-on · soft gel · Lanús
          </p>
          <h1 className="font-display text-[clamp(3.4rem,10.5vw,7.4rem)] leading-[0.88] text-ink">
            <SplitText as="span" text="uñas" className="block" delay={0.1} />
            <SplitText as="span" text="a tu talle," className="block text-bordo" delay={0.35} />
            <SplitText as="span" text="sin turno." className="block" delay={0.6} />
          </h1>
          <div ref={sub} className="mt-7 max-w-xl">
            <p className="text-lg leading-relaxed text-ink-soft md:text-xl">
              Diseños a pedido en soft gel semipermanente. Elegís del catálogo o armás el tuyo, medís tu
              talle y te llega el kit con las 10 uñas, pegamento y lima.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button href="/catalogo" size="lg" data-cursor="ver">
                  Ver catálogo
                </Button>
              </Magnetic>
              <Magnetic>
                <Button href="/disena" size="lg" variant="secondary" data-cursor="armar">
                  Diseñá tu set
                </Button>
              </Magnetic>
            </div>
            <p className="mt-6 text-sm text-ink-soft">
              Retiro en estación Lanús, Banfield o Escalada. Moto en zona. Correo Argentino al resto del país.
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-[min(78vw,440px)] md:w-full">
          <div className="absolute inset-[6%] -z-10 rounded-full bg-cream-deep" />
          <div className="absolute inset-[6%] -z-10 rounded-full leopard-bg opacity-40 [mask-image:radial-gradient(circle,black_30%,transparent_70%)]" />
          <div ref={kitty} className="relative will-change-transform">
            <Image
              src="/brand/logo-kitty.webp"
              alt="BF Studio, Kitty con orejas de leopardo guiñando"
              width={800}
              height={747}
              priority
              fetchPriority="high"
              sizes="(min-width: 768px) 40vw, 78vw"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
