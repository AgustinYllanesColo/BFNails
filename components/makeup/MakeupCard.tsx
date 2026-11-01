import type { MakeupProduct } from "@/lib/data/makeup";
import { formatARS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { MakeupVisual } from "./MakeupArt";
import { AddMakeupToCart } from "./AddMakeupToCart";

/** Tarjeta de maquillaje: dibujo o foto en 4:5, etiquetas, marca, nombre, una línea y precio, con botón para sumar. */
export function MakeupCard({ product, priority }: { product: MakeupProduct; priority?: boolean }) {
  const soldOut = product.stock === 0;
  const few = !soldOut && product.stock != null && product.stock <= 2;
  const sale = product.priceBefore != null && product.priceBefore > product.price;

  // Hasta dos etiquetas, la más útil primero: agotado / últimas, oferta, nuevo.
  const badges = [
    soldOut && (
      <Badge key="out" tone="ink" className="px-2">
        Agotado
      </Badge>
    ),
    few && (
      <Badge key="few" tone="yellow" className="px-2" title="Quedan pocas unidades">
        {product.stock === 1 ? "Última" : `Últimas ${product.stock}`}
      </Badge>
    ),
    sale && (
      <Badge key="sale" tone="red" className="px-2">
        Oferta
      </Badge>
    ),
    product.isNew && (
      <Badge key="new" tone="bordo" className="px-2">
        Nuevo
      </Badge>
    ),
  ]
    .filter(Boolean)
    .slice(0, 2);

  return (
    <article className="group flex h-full flex-col">
      <div className="relative">
        <MakeupVisual
          product={product}
          priority={priority}
          className={soldOut ? "opacity-60 saturate-50" : "transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1"}
        />
        {badges.length > 0 && <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="text-ink text-[17px] leading-tight font-bold tracking-tight text-pretty">{product.name}</h3>
        {(product.brand || product.description) && (
          <p className="text-ink-soft mt-1 truncate text-[13px]" title={product.description}>
            {product.brand && <span className="text-lip font-semibold">{product.brand}</span>}
            {product.brand && product.description && " · "}
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-3">
          <p className="rounded-pill bg-blush-soft text-lip mb-2.5 inline-flex items-baseline gap-1.5 px-3 py-1 text-sm font-bold tabular-nums">
            {sale && (
              <span className="text-ink-soft text-[11px] font-semibold line-through" aria-label={`Antes ${formatARS(product.priceBefore!)}`}>
                {formatARS(product.priceBefore!)}
              </span>
            )}
            {formatARS(product.price)}
          </p>
          <AddMakeupToCart product={product} />
        </div>
      </div>
    </article>
  );
}
