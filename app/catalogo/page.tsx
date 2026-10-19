import type { Metadata } from "next";
import { getDesigns } from "@/lib/data/repo";
import { getLivePromos } from "@/lib/data/content-repo";
import { Promos } from "@/components/sections/Promos";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Todos los sets de uñas press-on de BF Nails Studio, personalizados, con su precio.",
};

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CatalogoPage() {
  const [designs, promos] = await Promise.all([getDesigns(), getLivePromos()]);
  return (
    <div className="relative isolate pt-28 pb-24 md:pt-36">
      <div className="container-x relative">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Heading as="h1">Catálogo</Heading>
            <p className="mt-4 text-ink-soft">
              Cada precio incluye las 10 uñas y el kit de colocación. Si no encontrás el tuyo, armalo vos.
            </p>
          </div>
          <Button href="/disena" variant="secondary">
            Diseñá tu set
          </Button>
        </div>
      </div>
      <Promos promos={promos} />
      <div className="container-x relative">
        <h2 className="sr-only">Diseños</h2>
        <CatalogGrid designs={designs} />
      </div>
    </div>
  );
}
