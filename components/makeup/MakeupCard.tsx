import type { MakeupProduct } from "@/lib/data/makeup";
import { cn, formatARS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { MakeupVisual } from "./MakeupArt";
import { AddMakeupToCart } from "./AddMakeupToCart";

/**
 * Inclinación chica y fija para cada producto (de -1,5° a 1,5°, nunca 0), sacada del id: la misma tarjeta queda
 * siempre igual, como un sticker pegado a mano.
 */
export function makeupTilt(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const steps = [-1.5, -1, -0.5, 0.5, 1, 1.5];
  return steps[Math.abs(h) % steps.length];
}

/**
 * Tarjeta de maquillaje: dibujo o foto en 4:5, etiquetas, marca, nombre, dos líneas y precio, con botón para sumar.
 * Con `tilt`, el dibujo queda apenas inclinado y se endereza al pasar el mouse (o al enfocar la tarjeta).
 */
export function MakeupCard({ product, priority, tilt }: { product: MakeupProduct; priority?: boolean; tilt?: number }) {
  const soldOut = product.stock === 0;
  const few = product.stock === 1;
  const sale = product.priceBefore != null && product.priceBefore > product.price;

  // Hasta dos etiquetas, la más útil primero: agotado / últimas, oferta, nuevo.
  const badges = [
    soldOut && (
      <Badge key="out" tone="ink" className="px-2">
        Agotado
      </Badge>
    ),
    few && (
      <Badge key="few" tone="yellow" className="px-2" title="Queda una sola unidad">
        Última
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
      <div
        className={cn(
          "relative",
          tilt != null &&
            "rotate-[var(--tilt)] transition-[rotate] duration-500 ease-[var(--ease-out-expo)] group-focus-within:rotate-0 group-hover:rotate-0 motion-reduce:transition-none",
        )}
        style={tilt != null ? ({ "--tilt": `${tilt}deg` } as React.CSSProperties) : undefined}
      >
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
          <p className="text-ink-soft mt-1 line-clamp-2 text-[13px] leading-snug" title={product.description}>
            {product.brand && <span className="text-lip font-semibold">{product.brand}</span>}
            {product.brand && product.description && " · "}
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-3">
          <p className="rounded-pill text-lip ring-lip/10 mb-2.5 bg-white ring-1 inline-flex items-baseline gap-1.5 px-3 py-1 text-sm font-bold tabular-nums">
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
