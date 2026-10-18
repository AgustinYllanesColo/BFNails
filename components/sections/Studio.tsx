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
        <Reveal className="ring-bordo/10 relative overflow-hidden rounded-lg bg-white p-7 shadow-[0_30px_60px_-40px_rgba(74,14,14,0.4)] ring-1 md:p-12">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--bordo),var(--leopard)_55%,var(--yellow))]"
          />
          <div className="grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <Eyebrow className="text-bordo">También en el estudio</Eyebrow>
              <h2 className="font-display text-[clamp(1.9rem,4.5vw,3.2rem)] leading-[0.98] text-balance">
                Soft gel, kapping y semi, <span className="text-bordo">con turno.</span>
              </h2>
              <p className="text-ink-soft mt-4 max-w-lg">
                Si preferís que te las haga en persona: {services} en el estudio de{" "}
                {studio.area}, {studio.note}. Pedí tu turno por WhatsApp o por Instagram.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  href={waLink(WA_TURNO)}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="turno"
                >
                  Pedir turno por WhatsApp
                </Button>
                <Button
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                >
                  Instagram {siteConfig.instagramHandle}
                </Button>
              </div>
            </div>
            {/* La Kitty asoma desde abajo de la tarjeta, como un sticker pegado al borde: el recorte del
                dibujo original queda escondido por el borde de la tarjeta */}
            <div className="relative h-40 md:h-56">
              <Image
                src="/brand/kitty.webp"
                alt=""
                width={508}
                height={600}
                sizes="(min-width: 768px) 220px, 150px"
                className="absolute bottom-[-2.25rem] left-1/2 w-40 -translate-x-1/2 drop-shadow-[0_10px_16px_rgba(74,14,14,0.22)] md:bottom-[-3.5rem] md:w-56"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
