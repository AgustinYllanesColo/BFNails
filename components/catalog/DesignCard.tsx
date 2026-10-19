import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Design } from "@/lib/types";
import { LENGTH_LABEL, SHAPE_LABEL, designImage, inStock } from "@/lib/data/catalog";
import { formatARS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

/** Tarjeta del catálogo: foto real en 4:5. Si el diseño tiene una segunda foto, aparece al pasar el mouse. */
export function DesignCard({ design, priority }: { design: Design; priority?: boolean }) {
  const hasSecond = design.images.length > 1;
  return (
    <Link href={`/catalogo/${design.slug}`} className="group block" data-cursor="ver">
      {/* La foto lleva nombre de transición: al abrir la ficha, se convierte en la foto grande (morph) */}
      <ViewTransition name={`design-${design.slug}`} share="morph" default="none">
        <div className="bg-cream-deep ring-bordo/5 relative aspect-[4/5] overflow-hidden rounded-lg ring-1">
          <Image
            src={designImage(design, 0)}
            alt={design.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            preload={priority}
            loading={priority ? "eager" : undefined}
            quality={90}
            className={`object-cover transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105 ${hasSecond ? "group-hover:opacity-0" : ""}`}
          />
          {hasSecond && (
            <Image
              src={designImage(design, 1)}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover opacity-0 transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105 group-hover:opacity-100"
            />
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {design.featured && (
              <Badge tone="yellow" className="px-2" title="Favorito">
                <span aria-hidden>★</span>
                <span className="sr-only sm:not-sr-only">favorito</span>
              </Badge>
            )}
            {inStock(design) && (
              <Badge tone="green" className="px-2 sm:px-2.5" title="Entrega inmediata">
                En stock
              </Badge>
            )}
          </div>
        </div>
      </ViewTransition>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0">
          <h3 className="text-ink group-hover:text-bordo text-[17px] leading-tight font-bold tracking-tight">
            {design.name}
          </h3>
          <p className="text-ink-soft mt-0.5 text-xs">
            {SHAPE_LABEL[design.shape]} · {LENGTH_LABEL[design.length]}
          </p>
        </div>
        <p className="rounded-pill bg-cream-deep text-bordo shrink-0 px-3 py-1 text-sm font-bold">
          {formatARS(design.price)}
        </p>
      </div>
    </Link>
  );
}
