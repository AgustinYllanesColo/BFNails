import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";
import { Heading } from "@/components/ui/Section";
import { Brush } from "@/components/motion/Brush";
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
    <div className="pt-[calc(var(--nav-h)+24px)] pb-[var(--section-y-tight)] lg:pt-[calc(var(--nav-h)+32px)] lg:pb-0">
      <div className="container-x">
        <Builder
          config={config}
          intro={
            <header className="mb-7 max-w-2xl lg:mb-0">
              <Heading as="h1">
                Diseñá <Brush mode="load">tu set</Brush>
              </Heading>
              <p className="text-lead text-ink-soft measure-lead mt-4">
                Elegí y mirá cómo cambia el precio. El set base incluye 10 uñas a tu talle, pegamento y lima.
              </p>
            </header>
          }
        />
      </div>
    </div>
  );
}
