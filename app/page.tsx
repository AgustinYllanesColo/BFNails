import { Hero } from "@/components/sections/Hero";
import { Featured } from "@/components/sections/Featured";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BuilderCta } from "@/components/sections/BuilderCta";
import { Zones } from "@/components/sections/Zones";
import { Faq } from "@/components/sections/Faq";
import { Outro } from "@/components/sections/Outro";
import { Marquee } from "@/components/motion/Marquee";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { getFeaturedDesigns } from "@/lib/data/repo";
import styles from "@/components/sections/home.module.css";

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

/** Lo que trae el kit y cómo se usa: los mismos datos que el FAQ y Cómo funciona (nada inventado). */
const CLAIMS = [
  "10 uñas + pegamento + lima",
  "se ponen en 10 minutos",
  "duran de 1 a 3 semanas",
  "reutilizables",
  "envíos a todo el país",
];

/**
 * Home (PLAN §4 W2-B): Hero → cintas → Destacados (crema) → Cómo funciona (bordó) → Teaser del armador (crema
 * profundo, pico) → Envíos (crema) → Preguntas (crema profundo, apretada) → Cierre (crema, pico) → Footer.
 */
export default async function HomePage() {
  const featured = await getFeaturedDesigns(4);
  return (
    <>
      <Hero />
      <Tapes />
      <Featured designs={featured} />
      <HowItWorks />
      <BuilderCta />
      <Zones />
      <Faq />
      <Outro />
    </>
  );
}

/**
 * Dos cintas cruzadas bajo el hero: una de leopardo sin texto (la única del primer tramo) y la bordó con los datos del
 * kit. Las dos son más anchas que la pantalla y van giradas: la zona las recorta (`overflow-x-clip`) para que nunca
 * haya scroll horizontal. El giro vive en wrappers estáticos; la cinta bordó lleva el grano en su nodo quieto y la
 * Marquee solo inclina el texto al scrollear.
 */
function Tapes() {
  return (
    <AmbientZone className="relative z-10 -my-3 overflow-x-clip py-3">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 h-7 w-[108vw] -translate-x-1/2 -translate-y-1/2 rotate-[3deg] overflow-hidden shadow-sm md:rotate-[1.2deg]"
      >
        <div
          data-ambient="marquee"
          className={`leopard-trim h-full w-[calc(100%+560px)] ${styles.leoTrack}`}
        />
      </div>
      <div className="bg-bordo grain shadow-md relative left-1/2 w-[108vw] -translate-x-1/2 -rotate-[1.5deg]">
        <Marquee
          items={CLAIMS}
          speed={26}
          repeat={2}
          className="font-display text-cream py-3 text-[27px] leading-none md:py-4 md:text-[34px]"
        />
      </div>
    </AmbientZone>
  );
}
