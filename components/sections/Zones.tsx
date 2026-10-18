"use client";

import { Reveal } from "@/components/motion/Reveal";
import { Heading } from "@/components/ui/Section";
import { formatARS } from "@/lib/format";
import { Star } from "@/components/motion/Marquee";

const OPTIONS = [
  {
    title: "Retiro en estación",
    price: "Gratis",
    text: "Remedios de Escalada, Lanús o Banfield. Coordinamos día y horario por WhatsApp.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M10 34V14a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v20" />
        <path d="M10 34h28M14 40l-3 4M34 40l3 4M10 24h28" />
        <circle cx="17" cy="30" r="2" />
        <circle cx="31" cy="30" r="2" />
      </svg>
    ),
  },
  {
    title: "Moto en zona",
    price: `${formatARS(3500)} a ${formatARS(4500)}`,
    text: "Escalada, Lomas, Banfield y Lanús. El precio depende de la zona, te lo confirmo por WhatsApp.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="32" r="5" />
        <circle cx="36" cy="32" r="5" />
        <path d="M12 32l8-12h8l4 6h4M20 20l-4-6h-6M28 20l-2-6" />
      </svg>
    ),
  },
  {
    title: "Correo Argentino",
    price: "Se cotiza por CP",
    text: "A domicilio o a sucursal, a todo el país, con seguimiento. El costo lo ves antes de pagar.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="6" y="12" width="36" height="24" rx="3" />
        <path d="M6 14l18 12 18-12" />
      </svg>
    ),
  },
];

/** Tarjetas de envío: retiro, moto y Correo Argentino. */
export function Zones() {
  return (
    <section className="bg-cream-deep relative overflow-hidden py-20 md:py-28">
      <div className="container-x relative">
        <Reveal className="max-w-2xl">
          <Heading>Envíos y entregas</Heading>
          <p className="text-ink-soft mt-5 max-w-md">
            Estoy en Remedios de Escalada. Si sos de la zona nos vemos en la estación o te lo llevo en
            moto. Si no, va por Correo Argentino.
          </p>
        </Reveal>
        <Reveal className="mt-8 flex flex-wrap items-center gap-2">
          <span className="text-ink-soft text-sm">Moto y retiro en</span>
          {["Remedios de Escalada", "Lanús", "Banfield", "Lomas de Zamora"].map((z) => (
            <span
              key={z}
              className="rounded-pill bg-cream text-ink ring-bordo/10 px-3 py-1 text-sm font-semibold ring-1"
            >
              {z}
            </span>
          ))}
        </Reveal>
        <Reveal stagger={0.12} className="mt-8 grid gap-5 md:grid-cols-3">
          {OPTIONS.map((o) => (
            <div
              key={o.title}
              className="group bg-cream ring-bordo/10 relative overflow-hidden rounded-lg ring-1 transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(74,14,14,0.45)]"
            >
              <div className="bg-bordo text-cream flex items-center justify-between gap-4 px-6 py-5">
                <span className="rounded-pill bg-cream/10 ring-cream/20 grid size-12 place-items-center ring-1 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 [&>svg]:size-6">
                  {o.icon}
                </span>
                <span className="font-display text-yellow text-2xl leading-none">{o.price}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold tracking-tight">{o.title}</h3>
                <p className="text-ink-soft mt-2 text-sm leading-relaxed">{o.text}</p>
              </div>
              <span
                aria-hidden
                className="text-bordo/8 pointer-events-none absolute -right-4 -bottom-4 transition-transform duration-500 group-hover:rotate-12"
              >
                <Star size={96} />
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
