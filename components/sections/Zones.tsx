import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, Heading, Section } from "@/components/ui/Section";
import { Star } from "@/components/motion/Marquee";

const OPTIONS = [
  {
    title: "Retiro en estación",
    price: "Gratis",
    text: "Lanús, Banfield o Remedios de Escalada. Coordinamos día y horario por WhatsApp.",
  },
  {
    title: "Moto en zona",
    price: "Desde $2.500",
    text: "Te lo llevamos a tu casa si estás en Lanús y alrededores. Precio según barrio.",
  },
  {
    title: "Correo Argentino",
    price: "Se cotiza por CP",
    text: "A domicilio o a sucursal, a todo el país. El costo lo ves antes de pagar.",
  },
];

export function Zones() {
  return (
    <Section>
      <div className="container-x grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <Eyebrow>Entregas y envíos</Eyebrow>
          <Heading>
            Del sur del conurbano <span className="text-bordo">a todo el país</span>
          </Heading>
          <p className="mt-5 max-w-md text-ink-soft">
            BF Studio está en Lanús. Si sos de la zona nos vemos en la estación o te lo llevamos en moto.
            Si no, va por Correo Argentino con seguimiento.
          </p>
        </Reveal>
        <Reveal stagger={0.1} className="grid gap-4">
          {OPTIONS.map((o) => (
            <div
              key={o.title}
              className="flex items-start gap-4 rounded-lg bg-white/70 p-5 ring-1 ring-bordo/10 transition-all duration-500 ease-[var(--ease-out-expo)] hover:translate-x-1 hover:ring-bordo/30"
            >
              <span className="mt-1 text-bordo">
                <Star size={22} />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl">{o.title}</h3>
                  <span className="rounded-pill bg-cream-deep px-3 py-1 text-xs font-bold text-bordo">{o.price}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{o.text}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
