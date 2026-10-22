import { Hero } from "@/components/sections/Hero";
import { Featured } from "@/components/sections/Featured";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BuilderCta } from "@/components/sections/BuilderCta";
import { Zones } from "@/components/sections/Zones";
import { Studio } from "@/components/sections/Studio";
import { Faq } from "@/components/sections/Faq";
import { Marquee } from "@/components/motion/Marquee";
import { Promos } from "@/components/sections/Promos";
import { getFeaturedDesigns } from "@/lib/data/repo";
import { getKit, getLivePromos } from "@/lib/data/content-repo";

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function HomePage() {
  const [featured, promos, kit] = await Promise.all([getFeaturedDesigns(4), getLivePromos(), getKit()]);
  return (
    <>
      <Hero />
      {/* La banda rotada es más ancha que la pantalla: el contenedor la recorta para que no haya scroll horizontal */}
      <div className="relative z-10 -my-3 overflow-x-clip py-3">
        <div className="-mx-[4vw] w-[108vw] -rotate-[1.5deg]">
          <Marquee
            items={[
              "press-on personalizadas",
              "kit de colocación incluido",
              "reutilizables",
              "puntos de encuentro",
              "envíos a todo el país",
            ]}
            className="bg-bordo font-title text-cream py-3 text-xl md:py-4 md:text-2xl"
            speed={26}
          />
        </div>
      </div>
      <Promos promos={promos} />
      <Featured designs={featured} />
      <HowItWorks kit={kit} />
      <BuilderCta />
      <Zones />
      <Studio />
      <Faq />
    </>
  );
}
