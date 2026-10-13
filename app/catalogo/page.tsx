import type { Metadata } from "next";
import { getDesigns } from "@/lib/data/repo";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { Eyebrow, Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/motion/Stars";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Todos los sets de uñas press-on de BF Nails Studio, hechos a mano y a tu talle, con su precio.",
};

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CatalogoPage() {
  const designs = await getDesigns();
  return (
    <div className="relative isolate pt-28 pb-24 md:pt-36">
      {/* Estrellas decorativas: en el celular solo una chica a la derecha del titular (las grandes pisaban el texto y el menú) */}
      <Stars
        stars={[
          { x: "86%", y: "30%", size: 44, rotate: 12, speed: 0.7 },
          { x: "84%", y: "26%", size: 90, rotate: 12, speed: 0.7, mobile: false },
          { x: "-3%", y: "44%", size: 120, rotate: -8, speed: 0.5, mobile: false },
        ]}
        className="-z-10 max-h-[600px] opacity-60 md:opacity-80"
      />
      <div className="container-x relative">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow>Catálogo</Eyebrow>
            <Heading as="h1">
              Elegí tu <span className="text-bordo">próximo set</span>
            </Heading>
            <p className="mt-4 text-ink-soft">
              Todos los precios incluyen el kit completo: 10 uñas a tu talle, pegamento y lima. Si no encontrás
              lo que buscás, armalo vos.
            </p>
          </div>
          <Button href="/disena" variant="secondary">
            Diseñá tu set
          </Button>
        </div>
        <h2 className="sr-only">Diseños</h2>
        <CatalogGrid designs={designs} />
      </div>
    </div>
  );
}
