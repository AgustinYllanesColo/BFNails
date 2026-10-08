import { Hero } from "@/components/sections/Hero";
import { Featured } from "@/components/sections/Featured";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BuilderCta } from "@/components/sections/BuilderCta";
import { Zones } from "@/components/sections/Zones";
import { Faq } from "@/components/sections/Faq";
import { Marquee } from "@/components/motion/Marquee";
import { getFeaturedDesigns } from "@/lib/data/repo";

export default async function HomePage() {
  const featured = await getFeaturedDesigns(4);
  return (
    <>
      <Hero />
      <Marquee
        items={["press-on", "soft gel", "semipermanente", "a tu talle", "reutilizables", "hechas a mano"]}
        className="border-y border-bordo/10 bg-cream-deep py-3 font-display text-xl text-bordo md:text-2xl"
      />
      <Featured designs={featured} />
      <HowItWorks />
      <BuilderCta />
      <Zones />
      <Faq />
    </>
  );
}
