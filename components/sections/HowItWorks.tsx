import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, Heading, Section } from "@/components/ui/Section";

const STEPS = [
  {
    n: "01",
    title: "Elegí o diseñá",
    text: "Un set del catálogo, o armá el tuyo: forma, largo, color y técnicas. Ves el precio al toque.",
  },
  {
    n: "02",
    title: "Medí tu talle",
    text: "Con una cinta o un papel. Te guiamos paso a paso y si tenés dudas lo vemos por WhatsApp.",
  },
  {
    n: "03",
    title: "Pagá como quieras",
    text: "Mercado Pago o transferencia. Confirmás el pedido por WhatsApp y Bren se pone a trabajar.",
  },
  {
    n: "04",
    title: "Recibí y pegá",
    text: "Kit con 10 uñas, pegamento y lima. Se ponen en 10 minutos y duran semanas. Y se reusan.",
  },
];

export function HowItWorks() {
  return (
    <Section tone="bordo" className="grain overflow-hidden">
      <div className="container-x">
        <Reveal className="mb-14 max-w-2xl">
          <Eyebrow className="text-cream">Cómo funciona</Eyebrow>
          <Heading className="text-cream">
            De tu idea a tus manos en <span className="text-yellow">4 pasos</span>
          </Heading>
        </Reveal>
        <Reveal stagger={0.12} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="group relative rounded-lg bg-cream/5 p-6 ring-1 ring-cream/15 transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:bg-cream hover:text-ink"
            >
              <span className="font-display text-5xl text-yellow transition-colors group-hover:text-bordo">{s.n}</span>
              <h3 className="mt-4 font-display text-2xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-80">{s.text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
