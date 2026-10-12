"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { Brush } from "@/components/motion/Brush";
import { LogoStar } from "@/components/brand/LogoStar";
import { Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { MQ, isInViewportNow, registerEases } from "@/lib/motion";
import { waLink } from "@/lib/whatsapp";

gsap.registerPlugin(ScrollTrigger);

/** El mismo mensaje que el link de WhatsApp del footer. */
const WA_HELLO = "Hola Bren! Te escribo desde la web 🐱";

/** Dos estrellas sueltas alrededor del logo (las del asset no cuentan para el tope de tres por pantalla). */
const STARS = [
  { left: "-6%", top: "12%", size: 28 },
  { left: "88%", top: "70%", size: 14 },
];

/**
 * Cierre de la home (PLAN §4 W2-B.8): la Kitty del logo se "pega" (gira de −6° a 0 con un rebote corto), las dos
 * estrellas aparecen con un pop, el titular sube palabra por palabra y la pincelada se pinta con el scroll. Después
 * la Kitty flota (ambiente, se pausa fuera de vista). Dos CTAs: catálogo y WhatsApp.
 *
 * Nodos: el externo lleva la entrada (GSAP), el interno la flotación (CSS), así nunca se pisan. Con reduced-motion
 * todo queda quieto en su lugar salvo la flotación atenuada.
 */
export function Outro() {
  const logo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logo.current;
    if (!el) return;
    registerEases();
    const mm = gsap.matchMedia();
    mm.add(MQ.full, () => {
      if (isInViewportNow(el)) return;
      const stars = gsap.utils.toArray<HTMLElement>("[data-outro-star]", el);
      const art = el.querySelector<HTMLElement>("[data-outro-art]");
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 75%", once: true } });
      if (art) {
        gsap.set(art, { rotate: -6, scale: 0.94, autoAlpha: 0, transformOrigin: "50% 80%" });
        tl.to(art, { autoAlpha: 1, duration: 0.25, ease: "power1.out" }, 0).to(
          art,
          { rotate: 0, scale: 1, duration: 0.6, ease: "bf.bounce", clearProps: "transform,opacity,visibility" },
          0,
        );
      }
      if (stars.length) {
        gsap.set(stars, { scale: 0.6, autoAlpha: 0 });
        tl.to(
          stars,
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.5,
            ease: "back.out(2)",
            stagger: 0.08,
            clearProps: "transform,opacity,visibility",
          },
          0.25,
        );
      }
    });
    return () => mm.revert();
  }, []);

  return (
    <AmbientZone
      as="section"
      id="cierre"
      aria-labelledby="cierre-titulo"
      className="bg-cream relative py-[var(--section-y-peak)]"
    >
      <div className="container-x flex flex-col items-center text-center">
        <div ref={logo} className="relative w-[220px] md:w-[300px]">
          <div data-outro-art="">
            <div data-ambient="move" className="animate-logo-float">
              <Image
                src="/brand/logo-kitty.webp"
                width={800}
                height={745}
                alt="BF Studio"
                sizes="(min-width: 768px) 300px, 220px"
                className="h-auto w-full [filter:drop-shadow(var(--drop-shadow-logo))]"
              />
            </div>
          </div>
          {STARS.map((s, i) => (
            <span
              key={i}
              aria-hidden
              data-outro-star=""
              className="absolute"
              style={{ left: s.left, top: s.top }}
            >
              <LogoStar size={s.size} tilt />
            </span>
          ))}
        </div>

        <Heading reveal id="cierre-titulo" className="mx-auto mt-8 max-w-[14ch]">
          Tus próximas uñas, hechas <Brush mode="scrub">por Bren</Brush>.
        </Heading>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button href="/catalogo" size="lg" data-cursor="ver">
            Ver catálogo
          </Button>
          <Button
            href={waLink(WA_HELLO)}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="lg"
            iconLeft="whatsapp"
          >
            Escribile a Bren
          </Button>
        </div>
      </div>
    </AmbientZone>
  );
}
