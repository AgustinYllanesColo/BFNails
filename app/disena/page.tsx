import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";
import { Heading } from "@/components/ui/Section";
import { getBuilderConfig } from "@/lib/data/settings";
import { getDesigns } from "@/lib/data/repo";
import { presetVisible } from "@/lib/data/presets";
import { designImage } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Diseñá tu set",
  description: "Armá tus uñas press-on a medida: forma, largo, color y técnicas con precio en vivo.",
};

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function DisenaPage() {
  const [config, designs] = await Promise.all([getBuilderConfig(), getDesigns()]);
  // solo los diseños que el armador reproduce bien
  const presets = designs.filter((d) => presetVisible(d.slug)).map((d) => ({ slug: d.slug, name: d.name, image: designImage(d, 0) }));
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-10 max-w-2xl">
          <Heading as="h1">Diseñá tu set</Heading>
          <p className="mt-4 text-ink-soft">
            Elegí y mirá el precio al instante. Incluye el kit de colocación.
          </p>
        </div>
        <Builder config={config} presets={presets} />
      </div>
    </div>
  );
}
