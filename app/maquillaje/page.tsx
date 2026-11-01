import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMakeup } from "@/lib/data/content-repo";
import { MakeupGrid } from "@/components/makeup/MakeupGrid";
import { MakeupArt } from "@/components/makeup/MakeupArt";
import { Heading } from "@/components/ui/Section";
import { cn } from "@/lib/format";
import { MakeupJsonLd } from "@/components/seo/MakeupJsonLd";
import { pageMetadata } from "@/components/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Maquillaje en Lanús, envíos a todo el país",
  description:
    "Maquillaje de rostro, ojos, pestañas, cejas y labios, y brochas, con precio en pesos. Retiro en Remedios de Escalada, Lanús o Banfield y envíos a todo el país.",
  path: "/maquillaje",
});

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

/** Tres productos para la banda de arriba: uno de cada categoría distinta, primero los destacados. */
function pickHero(all: Awaited<ReturnType<typeof getMakeup>>) {
  const out: typeof all = [];
  for (const p of [...all].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))) {
    if (out.length === 3) break;
    if (!out.some((o) => o.category === p.category)) out.push(p);
  }
  return out;
}

const TILT = ["-rotate-6 translate-y-4", "rotate-3 -translate-y-2 z-10", "rotate-[8deg] translate-y-6"];

export default async function MaquillajePage() {
  const products = await getMakeup();
  const hero = pickHero(products);

  return (
    <div className="pb-24">
      <MakeupJsonLd products={products} />
      {/* Banda rosa: el maquillaje tiene su propio mundo dentro del sitio */}
      <section className="bg-blush relative isolate overflow-hidden rounded-b-[clamp(28px,5vw,56px)] pt-28 pb-10 md:pt-36 md:pb-16">
        <svg aria-hidden viewBox="0 0 400 400" className="text-blush-soft pointer-events-none absolute -top-40 -right-40 -z-10 size-[360px] md:-top-24 md:-right-24 md:size-[560px]">
          <circle cx="200" cy="200" r="200" fill="currentColor" />
        </svg>
        <div className="container-x grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-xl">
            <Heading as="h1" className="text-lip text-[clamp(2.5rem,6vw,4.5rem)]">
              Catálogo de maquillaje
            </Heading>
          </div>
          {hero.length === 3 && (
            <div className="hidden justify-center md:flex" aria-hidden>
              {hero.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    "relative -mx-3 w-[clamp(96px,13vw,190px)]",
                    TILT[i],
                  )}
                >
                  <div className="bg-blush-soft relative aspect-[4/5] overflow-hidden rounded-lg shadow-[0_18px_40px_-20px_rgba(142,31,61,0.55)] ring-4 ring-white">
                    <MakeupArt product={p} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="container-x mt-6 md:mt-14">
        <h2 className="sr-only">Productos</h2>
        <Suspense fallback={null}>
          <MakeupGrid products={products} />
        </Suspense>


        <Link
          href="/catalogo"
          className="group bg-cream-deep text-bordo mt-14 flex flex-wrap items-center justify-between gap-3 rounded-lg px-6 py-5 transition-colors duration-200 hover:bg-cream-ink/60 md:px-8"
        >
          <span className="font-title text-xl md:text-2xl">¿Y las uñas?</span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            Ver catálogo de uñas
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
