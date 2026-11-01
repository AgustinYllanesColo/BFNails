import { Hero } from "@/components/sections/Hero";
import { Doors } from "@/components/sections/Doors";
import { MakeupShowcase } from "@/components/sections/MakeupShowcase";
import { Featured } from "@/components/sections/Featured";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BuilderCta } from "@/components/sections/BuilderCta";
import { Zones } from "@/components/sections/Zones";
import { Studio } from "@/components/sections/Studio";
import { Faq } from "@/components/sections/Faq";
import { Marquee } from "@/components/motion/Marquee";
import { Promos } from "@/components/sections/Promos";
import { getDesigns } from "@/lib/data/repo";
import { getFeaturedMakeup, getKit, getLivePromos, getMakeup } from "@/lib/data/content-repo";

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

/** Mismo criterio que getFeaturedDesigns, sin volver a leer la base. */
const FEATURED_NAILS = 4;

/**
 * Home de BF Studio, mitad uñas y mitad maquillaje: hero con las dos líneas, las dos tiendas como puertas, el
 * maquillaje (lo nuevo) primero y después todo lo de uñas, envíos, estudio y preguntas.
 */
export default async function HomePage() {
  const [designs, makeup, featuredMakeup, promos, kit] = await Promise.all([
    getDesigns(),
    getMakeup(),
    getFeaturedMakeup(6),
    getLivePromos(),
    getKit(),
  ]);
  const featured = (designs.some((d) => d.featured) ? designs.filter((d) => d.featured) : designs).slice(0, FEATURED_NAILS);
  return (
    <>
      <Hero />
      {/* La banda rotada es más ancha que la pantalla: el contenedor la recorta para que no haya scroll horizontal */}
      <div className="relative z-10 -my-3 overflow-x-clip py-3">
        <div className="-mx-[4vw] w-[108vw] -rotate-[1.5deg]">
          <Marquee
            items={["maquillaje", "uñas press-on", "labios, ojos y rostro", "kit de colocación incluido", "envíos a todo el país"]}
            className="bg-bordo font-title text-cream py-3 text-xl md:py-4 md:text-2xl"
            speed={26}
          />
        </div>
      </div>
      <Doors makeup={makeup} nailsCount={designs.length} />
      <MakeupShowcase products={featuredMakeup} />
      <Promos promos={promos} />
      <Featured designs={featured} />
      <BuilderCta />
      <HowItWorks kit={kit} />
      <Zones />
      <Studio />
      <Faq />
    </>
  );
}
