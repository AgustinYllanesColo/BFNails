import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { siteConfig } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";

const WA_TURNO = "Hola Bren! Quiero pedir turno en el estudio 🐱";

/**
 * Servicio presencial, a propósito chico: una tarjeta que cuenta qué se hace en el estudio y manda directo a
 * WhatsApp o Instagram. No tiene página propia ni formulario: el turno se coordina por chat.
 */
export function Studio() {
  const { studio } = siteConfig;
  const services = `${studio.services.slice(0, -1).join(", ")} y ${studio.services.at(-1)}`;
  return (
    <section className="relative py-16 md:py-24">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-lg bg-white p-7 ring-1 ring-bordo/10 shadow-[0_30px_60px_-40px_rgba(74,14,14,0.4)] md:p-12">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--bordo),var(--leopard)_55%,var(--yellow))]" />
          <div className="grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <Eyebrow className="text-bordo">También en el estudio</Eyebrow>
              <h2 className="font-display text-balance text-[clamp(1.9rem,4.5vw,3.2rem)] leading-[0.98]">
                Soft gel, kapping y semi, <span className="text-bordo">con turno.</span>
              </h2>
              <p className="mt-4 max-w-lg text-ink-soft">
                Si preferís que Bren te las haga en persona: {services} en el estudio de {studio.area}, {studio.note}. Pedí tu turno por WhatsApp o por Instagram.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href={waLink(WA_TURNO)} target="_blank" rel="noreferrer" data-cursor="turno">
                  Pedir turno por WhatsApp
                </Button>
                <Button href={siteConfig.instagram} target="_blank" rel="noreferrer" variant="secondary">
                  Instagram {siteConfig.instagramHandle}
                </Button>
              </div>
            </div>
            <div className="relative mx-auto grid size-44 place-items-center md:size-60">
              <span aria-hidden className="absolute inset-0 rounded-full bg-cream-deep ring-4 ring-cream ring-offset-4 ring-offset-leopard" />
              <span aria-hidden className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_40%_30%,#fffdf8,transparent_65%)]" />
              <Image src="/brand/kitty.webp" alt="" width={236} height={280} sizes="(min-width: 768px) 170px, 120px" className="relative w-[54%] drop-shadow-[0_8px_12px_rgba(74,14,14,0.22)]" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
