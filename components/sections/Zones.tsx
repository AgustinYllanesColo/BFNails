"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, Heading } from "@/components/ui/Section";
import { formatARS } from "@/lib/format";

gsap.registerPlugin(ScrollTrigger);

const OPTIONS = [
  {
    title: "Retiro en estación",
    price: "Gratis",
    text: "Lanús, Banfield o Remedios de Escalada. Coordinamos día y horario por WhatsApp.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10 34V14a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v20" />
        <path d="M10 34h28M14 40l-3 4M34 40l3 4M10 24h28" />
        <circle cx="17" cy="30" r="2" /><circle cx="31" cy="30" r="2" />
      </svg>
    ),
  },
  {
    title: "Moto en zona",
    price: `Desde ${formatARS(2500)}`,
    text: "Te lo llevamos a tu casa si estás cerca. El precio final depende del barrio y lo confirmamos por WhatsApp.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="32" r="5" /><circle cx="36" cy="32" r="5" />
        <path d="M12 32l8-12h8l4 6h4M20 20l-4-6h-6M28 20l-2-6" />
      </svg>
    ),
  },
  {
    title: "Correo Argentino",
    price: "Se cotiza por CP",
    text: "A domicilio o a sucursal, a todo el país, con seguimiento. El costo lo ves antes de pagar.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="6" y="12" width="36" height="24" rx="3" />
        <path d="M6 14l18 12 18-12" />
      </svg>
    ),
  },
];

/** Tarjetas con tilt al mouse y una línea de ruta punteada que se dibuja al hacer scroll. */
export function Zones() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const path = el.querySelector<SVGPathElement>("[data-route]");
      if (path) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: `${len}`, strokeDashoffset: len });
        gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 60%", scrub: 0.6 } });
      }
      if (!window.matchMedia("(pointer: fine)").matches) return;
      el.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
        gsap.set(card, { transformPerspective: 900 });
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 12);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
        });
        card.addEventListener("mouseleave", () => {
          rx(0);
          ry(0);
        });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-cream-deep py-20 md:py-28">
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full w-full text-bordo/25" viewBox="0 0 1440 600" preserveAspectRatio="none" fill="none">
        <path data-route d="M-20 520 C 200 380, 420 620, 640 430 S 1040 260, 1460 120" stroke="currentColor" strokeWidth="2" strokeDasharray="8 10" />
      </svg>
      <div className="container-x relative">
        <Reveal className="max-w-2xl">
          <Eyebrow>Entregas y envíos</Eyebrow>
          <Heading>
            Del sur del conurbano <span className="text-bordo">a todo el país</span>
          </Heading>
          <p className="mt-5 max-w-md text-ink-soft">BF Studio está en Lanús. Si sos de la zona nos vemos en la estación o te lo llevamos. Si no, viaja por Correo Argentino.</p>
        </Reveal>
        <Reveal stagger={0.12} className="mt-12 grid gap-5 md:grid-cols-3">
          {OPTIONS.map((o) => (
            <div key={o.title} data-tilt className="group relative rounded-lg bg-cream p-7 ring-1 ring-bordo/10 transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(74,14,14,0.45)]" style={{ transformStyle: "preserve-3d" }}>
              <span className="grid size-14 place-items-center rounded-pill bg-bordo text-cream transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 [&>svg]:size-7">{o.icon}</span>
              <h3 className="mt-6 font-display text-2xl">{o.title}</h3>
              <p className="mt-1 text-sm font-bold text-bordo">{o.price}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{o.text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
