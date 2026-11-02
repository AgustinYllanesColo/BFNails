"use client";

import { useState } from "react";
import { makeupMedia, type MakeupProduct } from "@/lib/data/makeup";
import { cn, formatARS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { MakeupVisual } from "./MakeupArt";
import { AddMakeupToCart } from "./AddMakeupToCart";
import { MakeupDetail } from "./MakeupDetail";

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
export function MakeupCard({ product, priority, tilt: tiltProp }: { product: MakeupProduct; priority?: boolean; tilt?: number }) {
  // las fotos van derechas, como las tarjetas de uñas; la inclinación es solo para los dibujos provisorios
  const tilt = product.image ? undefined : tiltProp;
  const soldOut = product.stock === 0;
  const few = product.stock === 1;
  const sale = product.priceBefore != null && product.priceBefore > product.price;
  const [open, setOpen] = useState(false);
  const extra = makeupMedia(product).length - 1;

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
    // id: ancla de cada producto (/maquillaje#<id>, la usan los datos estructurados); scroll-mt para que la barra fija no lo tape
    <article id={product.id} className="group flex h-full scroll-mt-28 flex-col">
      <div
        className={cn(
          "relative",
          tilt != null &&
            "rotate-[var(--tilt)] transition-[rotate] duration-300 ease-[var(--ease-out-expo)] group-focus-within:rotate-0 group-hover:rotate-0 motion-reduce:transition-none",
        )}
        style={tilt != null ? ({ "--tilt": `${tilt}deg` } as React.CSSProperties) : undefined}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="focus-visible:outline-bordo block w-full cursor-zoom-in rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="sr-only">Ver {product.name} en grande</span>
          <MakeupVisual
            product={product}
            priority={priority}
            video
            className={
              soldOut
                ? "opacity-60 saturate-50"
                : "transition-transform duration-300 ease-[var(--ease-out-expo)] motion-safe:group-hover:-translate-y-1"
            }
          />
        </button>
        {badges.length > 0 && <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">{badges}</div>}
        {/* aviso de que se puede ampliar: siempre en el celu (no hay hover), al pasar el mouse en la compu */}
        <span
          aria-hidden
          className="text-ink pointer-events-none absolute right-2.5 bottom-2.5 inline-flex h-8 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[11px] font-bold shadow-sm transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4M11 8.5v5M8.5 11h5" />
          </svg>
          {extra > 0 ? `+${extra}` : "Ver"}
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        {/* nombres largos del admin: se parten donde haga falta y no pasan de tres renglones (el completo queda en el title) */}
        <h3 className="text-ink line-clamp-3 text-[17px] leading-tight font-bold tracking-tight text-pretty [overflow-wrap:anywhere]" title={product.name}>
          {/* el nombre también abre la vista ampliada; para el lector ya está el botón de la foto */}
          <button type="button" tabIndex={-1} onClick={() => setOpen(true)} className="hover:text-lip text-left transition-colors">
            {product.name}
          </button>
        </h3>
        {(product.brand || product.description) && (
          <p className={cn("text-ink-soft mt-1 text-[13px] leading-snug [overflow-wrap:anywhere]", product.category === "combos" ? "line-clamp-6" : "line-clamp-2")} title={product.description}>
            {product.brand && <span className="text-lip font-semibold">{product.brand}</span>}
            {product.brand && product.description && " · "}
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-3">
          <p className="rounded-pill text-lip ring-lip/10 mb-2.5 inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 bg-white px-3 py-1 text-sm font-bold tabular-nums ring-1">
            {sale && (
              <s className="text-ink-soft text-[11px] font-semibold">
                <span className="sr-only">Antes </span>
                {formatARS(product.priceBefore!)}
              </s>
            )}
            {sale && <span className="sr-only">, ahora </span>}
            <span className="whitespace-nowrap">{formatARS(product.price)}</span>
          </p>
          <AddMakeupToCart product={product} />
        </div>
      </div>
      <MakeupDetail product={product} open={open} onClose={() => setOpen(false)} />
    </article>
  );
}
