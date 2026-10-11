import { Hero } from "@/components/sections/Hero";
import { Featured } from "@/components/sections/Featured";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BuilderCta } from "@/components/sections/BuilderCta";
import { Zones } from "@/components/sections/Zones";
import { Faq } from "@/components/sections/Faq";
import { Marquee } from "@/components/motion/Marquee";
import { getFeaturedDesigns } from "@/lib/data/repo";

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function HomePage() {
  const featured = await getFeaturedDesigns(4);
  return (
    <>
      <Hero />
      {/* La banda rotada es más ancha que la pantalla: el contenedor la recorta para que no haya scroll horizontal */}
      <div className="relative z-10 -my-3 overflow-x-clip py-3">
        <div className="-mx-[4vw] w-[108vw] -rotate-[1.5deg]">
          <Marquee
            items={[
              "press-on en soft gel",
              "a tu talle",
              "hechas a mano",
              "reutilizables",
              "Lanús",
              "envíos a todo el país",
            ]}
            className="bg-bordo font-display text-cream py-3 text-xl md:py-4 md:text-2xl"
            speed={26}
          />
        </div>
      </div>
      <Featured designs={featured} />
      <HowItWorks />
      <BuilderCta />
      <Zones />
      <Faq />
    </>
  );
}
