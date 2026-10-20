import type { Metadata } from "next";
import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDesign, getDesigns } from "@/lib/data/repo";
import { getBuilderConfig } from "@/lib/data/settings";
import {
  inStock,
  FINISH_LABEL,
  designImage,
} from "@/lib/data/catalog";
import { formatARS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { AddDesignToCart } from "@/components/cart/AddDesignToCart";
import { PRESETS } from "@/lib/data/presets";
import { DesignCard } from "@/components/catalog/DesignCard";
import { Reveal } from "@/components/motion/Reveal";
import { KitItems } from "@/components/kit/KitItems";
import { getKit } from "@/lib/data/content-repo";

type Props = { params: Promise<{ slug: string }> };

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const design = await getDesign(slug);
  if (!design) return { title: "Diseño" };
  return {
    title: design.name,
    description: `${design.description} ${formatARS(design.price)}, kit completo.`,
    openGraph: { images: [{ url: designImage(design, 0) }] },
  };
}

export default async function DesignPage({ params }: Props) {
  const { slug } = await params;
  const design = await getDesign(slug);
  if (!design) notFound();
  const [all, config, kit] = await Promise.all([getDesigns(), getBuilderConfig(), getKit()]);
  const related = all
    .filter(
      (d) =>
        d.slug !== design.slug &&
        (d.shape === design.shape || d.tags.some((t) => design.tags.includes(t))),
    )
    .slice(0, 4);
  const gallery = design.images.length ? design.images : [designImage(design, 0)];

  return (
    <div className="pt-24 pb-24 md:pt-32">
      <div className="container-x">
        <nav className="text-ink-soft mb-6 text-sm" aria-label="Migas">
          <Link href="/catalogo" className="hover:text-bordo">
            Catálogo
          </Link>{" "}
          / <span className="text-ink">{design.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Galería: la foto principal en 4:5 y, si hay más, las demás debajo en dos columnas */}
          <div className="grid grid-cols-2 gap-3">
            {/* La foto principal viene "volando" desde la tarjeta del catálogo (mismo nombre de transición) */}
            <ViewTransition name={`design-${design.slug}`} share="morph" default="none">
              <div className="bg-cream-deep relative col-span-2 aspect-[4/5] overflow-hidden rounded-lg">
                <Image
                  src={gallery[0]}
                  alt={`${design.name}, vista 1`}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  quality={90}
                  preload
                  loading="eager"
                  className="object-cover"
                />
              </div>
            </ViewTransition>
            {gallery.slice(1).map((src, i) => (
              <Reveal
                key={src}
                delay={0.1 * i}
                className="bg-cream-deep relative aspect-[4/5] overflow-hidden rounded-lg"
              >
                <Image
                  src={src}
                  alt={`${design.name}, vista ${i + 2}`}
                  fill
                  sizes="(min-width: 1024px) 27vw, 50vw"
                  quality={90}
                  className="object-cover"
                />
              </Reveal>
            ))}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <div className="flex flex-wrap gap-2">
                {design.featured && <Badge tone="yellow">★ favorito</Badge>}
                {inStock(design) && <Badge tone="green">Entrega inmediata</Badge>}
                {design.tags.filter((t) => t !== "stock").map((t) => (
                  <Badge key={t} tone="cream" className="normal-case">
                    {t}
                  </Badge>
                ))}
              </div>
              <h1 className="font-display mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.95]">
                {design.name}
              </h1>
              <p className="text-ink-soft mt-4 text-lg">{design.description}</p>

              <p className="rounded-pill bg-cream-deep text-bordo mt-5 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold">
                Acabado {FINISH_LABEL[design.finish].toLowerCase()}
              </p>

              <AddDesignToCart design={design} config={config} />

              {PRESETS[design.slug] && (
                <p className="text-ink-soft mt-4 text-sm">
                  ¿Lo querés con otro color o con otros acentos?{" "}
                  <Link href={`/disena?desde=${design.slug}`} className="text-bordo font-semibold underline underline-offset-4">
                    Modificalo en el armador
                  </Link>
                </p>
              )}

              <div className="mt-8 border-t border-bordo/10 pt-6">
                <p className="text-sm font-semibold">10 uñas + kit de colocación</p>
                <KitItems items={kit.items} className="mt-3" />
                <p className="text-ink-soft mt-4 text-sm">
                  {inStock(design) ? "En stock: sale en el momento." : "A pedido: 3 a 7 días."} Retiro en estación gratis o
                  envío por Correo Argentino.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <Reveal>
              <h2 className="font-display text-3xl">También te pueden gustar</h2>
            </Reveal>
            <Reveal stagger={0.08} className="mt-6 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {related.map((d) => (
                <DesignCard key={d.slug} design={d} />
              ))}
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
