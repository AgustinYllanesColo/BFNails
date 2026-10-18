import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
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
              <h2 className="font-display text-balance text-[clamp(1.75rem,3.6vw,2.5rem)] leading-[1.05]">
                También en el estudio
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
            {/* La Kitty con las estrellas del logo: el dibujo completo, sin recortes */}
            <div className="mx-auto w-48 md:w-full md:max-w-[260px]">
              <Image
                src="/brand/logo-kitty.webp"
                alt=""
                width={800}
                height={747}
                sizes="(min-width: 768px) 260px, 192px"
                className="h-auto w-full drop-shadow-[0_10px_16px_rgba(74,14,14,0.18)]"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
