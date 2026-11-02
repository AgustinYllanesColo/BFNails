import type { Metadata } from "next";
import { Suspense } from "react";
import { getDesigns } from "@/lib/data/repo";
import { getLivePromos } from "@/lib/data/content-repo";
import { Promos } from "@/components/sections/Promos";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { MakeupBanner } from "@/components/makeup/MakeupBanner";
import { pageMetadata } from "@/components/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Uñas press-on personalizadas en Lanús",
  description:
    "Sets de uñas press-on con kit de colocación y precio en pesos. Retiro en Remedios de Escalada, Lanús o Banfield, moto en zona sur y envíos a todo el país.",
  path: "/catalogo",
});

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CatalogoPage() {
  const [designs, promos] = await Promise.all([getDesigns(), getLivePromos()]);
  return (
    <div className="relative isolate pt-28 pb-24 md:pt-36">
      <div className="container-x relative">
        <div className="mb-10 max-w-2xl">
          <Heading as="h1">Catálogo de uñas</Heading>
          <p className="mt-4 text-ink-soft">
            Uñas disponibles en stock para entrega inmediata, con kit de aplicación incluido. Y si no sabés qué
            pedir, también te dejo algunas opciones hechas por mí para que elijas más rápido.
          </p>
          {/* debajo de la intro: el armador y el aviso del maquillaje, que no compite con el título */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button href="/disena" variant="secondary">
              Diseñá tu set
            </Button>
            <MakeupBanner />
          </div>
        </div>
      </div>
      <Promos promos={promos} />
      <div className="container-x relative">
        <h2 className="sr-only">Diseños</h2>
        <Suspense fallback={null}>
          <CatalogGrid designs={designs} />
        </Suspense>
      </div>
    </div>
  );
}
