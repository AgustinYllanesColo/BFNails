import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Star } from "@/components/motion/Marquee";

export function BuilderCta() {
  return (
    <Section tone="deep" className="overflow-hidden">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-lg bg-cream p-8 ring-1 ring-bordo/10 md:p-14">
          <div className="pointer-events-none absolute -top-10 -right-10 text-bordo/10">
            <Star size={260} />
          </div>
          <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="mb-3 text-xs font-bold tracking-[0.2em] text-bordo uppercase">Armador</p>
              <h2 className="font-display text-balance text-[clamp(2rem,5vw,3.8rem)] leading-[0.95]">
                ¿Tenés algo en la cabeza? <span className="text-bordo">Armalo</span> y mirá cuánto sale.
              </h2>
              <p className="mt-4 max-w-lg text-ink-soft">
                Elegí forma, largo, color base y las técnicas que quieras. El precio se arma en vivo, sin
                preguntar. Si querés algo muy especial, Bren te lo cotiza por WhatsApp.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Button href="/disena" size="lg" variant="leopard" data-cursor="armar">
                Diseñá tu set
              </Button>
              <p className="text-xs text-ink-soft">Desde $12.000 el set completo</p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
