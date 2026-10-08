import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";
import { Eyebrow, Heading } from "@/components/ui/Section";
import { getBuilderConfig } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Diseñá tu set",
  description: "Armá tus uñas press-on a medida: forma, largo, color y técnicas con precio en vivo.",
};

export default async function DisenaPage() {
  const config = await getBuilderConfig();
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-10 max-w-2xl">
          <Eyebrow>Armador</Eyebrow>
          <Heading as="h1">
            Diseñá <span className="text-bordo">tu set</span>
          </Heading>
          <p className="mt-4 text-ink-soft">
            Elegí y mirá cómo cambia el precio. El set base incluye 10 uñas a tu talle, pegamento y lima.
          </p>
        </div>
        <Builder config={config} />
      </div>
    </div>
  );
}
