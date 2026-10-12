import Image from "next/image";
import Link from "next/link";
import type { Design } from "@/lib/types";
import { LENGTH_LABEL, SHAPE_LABEL, designImage } from "@/lib/data/catalog";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";
import { Price } from "@/components/ui/Price";
import { NailSwatch } from "@/components/ui/NailSwatch";
import { LogoStar } from "@/components/brand/LogoStar";

/**
 * Tarjeta de diseño del catálogo (PLAN W1-F2.17), pensada para fotos reales en 4:5.
 * - Con puntero fino, al pasar el mouse la foto crece 4 % y cruza a la segunda (solo si hay dos del mismo tipo:
 *   nunca se mezcla una foto real con un dibujo). En el celular, apretar la tarjeta la hunde apenas (98 %).
 * - Favorito: sticker amarillo con troquel crema, inclinado en un wrapper.
 * - Nombre en dos líneas como mucho; forma · largo a la izquierda y precio a la derecha, siempre dentro de la tarjeta.
 * - Sin fotos: puente hasta el placeholder 4:5 de W2-C (PLAN §4 W2-C.8). El SVG actual de `/api/placeholder` es
 *   cuadrado con las uñas arriba y en 4:5 deja ~40 % de crema vacía abajo; mientras `designImage` no traiga `v=`
 *   (la versión 4:5), la tarjeta dibuja el abanico del set con `NailSwatch` centrado sobre papel crema y la estrella
 *   bordó abajo a la derecha. Cuando W2-C publique `v=2`, esta rama se apaga sola (W3 la puede borrar).
 */
type Props = {
  design: Design;
  /** Primeras tarjetas visibles: carga inmediata y prioridad alta (reemplaza a `priority` de next/image). */
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/** ¿Es el placeholder cuadrado de antes (sin `v=`)? */
function isLegacyPlaceholder(src: string): boolean {
  return src.startsWith("/api/placeholder") && !/[?&]v=\d/.test(src);
}

/** Base y punta del abanico a partir de la paleta y los tags del diseño. */
function swatchColors(d: Design): { base: string; tip?: string } {
  const [first = "#e8c4b0", second] = d.colors ?? [];
  const tags = d.tags.map((t) => t.toLowerCase());
  const leopard = tags.some((t) => t.includes("animal") || t.includes("leopard"));
  const french = tags.some((t) => t.includes("francesita"));
  return { base: leopard ? "animal-print" : first, tip: french ? second : undefined };
}

export function DesignCard({ design: d, priority = false, sizes, className }: Props) {
  const src = designImage(d, 0);
  const drawn = d.images.length === 0 && isLegacyPlaceholder(src);
  const hasSecond = !drawn && d.images.length !== 1;
  const imgSizes = sizes ?? "(min-width: 1024px) 25vw, 50vw";
  return (
    <Link
      href={`/catalogo/${d.slug}`}
      className={cn("group block rounded-lg", className)}
      data-cursor="ver"
    >
      <div className="bg-cream-deep relative aspect-[4/5] overflow-hidden rounded-[20px] transition-[scale] duration-150 ease-[var(--ease-ui)] group-active:scale-[0.98]">
        {drawn ? (
          <div
            data-card-placeholder=""
            className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_28%_18%,var(--cream-50)_0%,var(--cream-200)_55%,var(--cream-300)_100%)]"
          >
            <NailSwatch
              shape={d.shape}
              finish={d.finish}
              {...swatchColors(d)}
              title={d.name}
              className="h-auto w-[66%] -translate-y-[3%] drop-shadow-[0_10px_14px_rgb(74_14_14/0.14)] transition-[scale,rotate] duration-300 ease-[var(--ease-ui)] group-hover:-rotate-3 group-hover:scale-[1.04]"
            />
            <LogoStar size={18} tilt className="absolute right-3.5 bottom-3.5" />
          </div>
        ) : (
          <Image
            src={src}
            alt={d.name}
            fill
            sizes={imgSizes}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            className={cn(
              "object-cover transition-[opacity,scale] duration-300 ease-[var(--ease-ui)] group-hover:scale-[1.04]",
              hasSecond && "group-hover:opacity-0",
            )}
          />
        )}
        {hasSecond ? (
          <Image
            src={designImage(d, 1)}
            alt=""
            fill
            sizes={imgSizes}
            loading="lazy"
            className="hidden object-cover opacity-0 transition-[opacity,scale] duration-300 ease-[var(--ease-ui)] group-hover:scale-[1.04] group-hover:opacity-100 [@media(hover:hover)]:block"
          />
        ) : null}
        {d.featured ? (
          <span className="absolute top-2.5 left-2.5 -rotate-6">
            <span className="border-cream bg-yellow text-ink shadow-sticker grid size-8 place-items-center rounded-full border-[3px]">
              <Icon name="star" size={14} />
              <span className="sr-only">Favorito</span>
            </span>
          </span>
        ) : null}
      </div>
      <div className="mt-3 min-w-0">
        <h3 className="text-title text-ink group-hover:text-bordo line-clamp-2 [overflow-wrap:anywhere] transition-colors duration-200">
          {d.name}
        </h3>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="text-meta text-ink-soft min-w-0 truncate">
            {SHAPE_LABEL[d.shape]} · {LENGTH_LABEL[d.length]}
          </p>
          <Price value={d.price} size="sm" className="text-bordo shrink-0" />
        </div>
      </div>
    </Link>
  );
}
