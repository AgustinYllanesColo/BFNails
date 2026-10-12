import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDesigns } from "@/lib/data/repo";
import { CatalogBrowser, CatalogGrid } from "@/components/catalog/CatalogGrid";
import { Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { Brush } from "@/components/motion/Brush";
import { Stars } from "@/components/motion/Stars";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Todos los sets de uñas press-on soft gel de BF Nails Studio con su precio.",
};

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CatalogoPage() {
  const designs = await getDesigns();
  return (
    <div className="relative isolate pt-[calc(var(--nav-h)+24px)] pb-[var(--section-y)] md:pt-[calc(var(--nav-h)+56px)]">
      {/* Trío del logo arriba a la derecha, al costado del titular (≥ 12 px de aire con cualquier texto y lejos de la
          píldora del nav). La chica también en el celular; la grande y la del borde izquierdo, desde md. */}
      <Stars
        stars={[
          { x: "calc(100% - var(--gutter) - 38px)", y: "14px", size: 38, rotate: 14, speed: 0.6 },
          { x: "88%", y: "10%", size: 90, rotate: 12, speed: 0.7, mobile: false },
          { x: "-6%", y: "46%", size: 120, rotate: -8, speed: 0.5, mobile: false },
        ]}
        className="top-[calc(var(--nav-h)+8px)] -z-10 max-h-[600px]"
      />
      <div className="container-x relative">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 md:mb-10">
          <div className="max-w-2xl">
            <Heading as="h1" className="text-h2 md:text-h1">
              Elegí tu <Brush mode="load">próximo set</Brush>
            </Heading>
            <p className="text-ink-soft mt-3 max-w-[46ch] text-pretty md:mt-5 md:text-lead">
              Cada precio es el kit completo: 10 uñas a tu talle, pegamento y lima.{" "}
              <Link
                href="/disena"
                className="text-bordo inline-flex items-center gap-1 font-semibold whitespace-nowrap underline decoration-[1.5px] underline-offset-4 md:hidden"
              >
                O armalo vos
                <Icon name="arrow" size={16} />
              </Link>
              <span className="hidden md:inline">Si no encontrás el tuyo, armalo vos.</span>
            </p>
          </div>
          <Button href="/disena" variant="secondary" iconRight="arrow" className="hidden md:inline-flex">
            Diseñá tu set
          </Button>
        </header>
        <h2 className="sr-only">Diseños</h2>
        <Suspense fallback={<CatalogBrowser designs={designs} />}>
          <CatalogGrid designs={designs} />
        </Suspense>
      </div>
    </div>
  );
}
