import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";
import { Heading } from "@/components/ui/Section";
import { getBuilderConfig } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Diseñá tu set",
  description: "Armá tus uñas press-on a medida: forma, largo, color y técnicas con precio en vivo.",
};

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function DisenaPage() {
  const config = await getBuilderConfig();
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-10 max-w-2xl">
          <Heading as="h1">Diseñá tu set</Heading>
          <p className="mt-4 text-ink-soft">
            Elegí y mirá el precio al instante. Incluye el kit de colocación.
          </p>
        </div>
        {/* Sin "Partí de un diseño de Brenda" (pedido de Brenda): el armador arranca en blanco. */}
        <Builder config={config} />
      </div>
    </div>
  );
}
