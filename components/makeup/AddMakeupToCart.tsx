"use client";

import { useRef, useState } from "react";
import type { MakeupProduct } from "@/lib/data/makeup";
import { makeupMaxQty } from "@/lib/data/makeup";
import { useCart } from "@/lib/store/cart";
import { useHydrated } from "@/lib/hooks";
import { flyToCart } from "@/components/motion/flyToCart";
import { cn } from "@/lib/format";

/** Suma una unidad del producto. Respeta el stock: agotado no se puede sumar, y no deja pasar de lo que hay. */
export function AddMakeupToCart({ product, className }: { product: MakeupProduct; className?: string }) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) =>
    s.items.reduce((a, i) => (i.kind === "makeup" && i.makeupId === product.id ? a + i.qty : a), 0),
  );
  const hydrated = useHydrated();
  const [added, setAdded] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const max = makeupMaxQty(product);
  const soldOut = max === 0;
  const full = !soldOut && hydrated && inCart >= max;

  const onAdd = () => {
    if (soldOut || full) return;
    flyToCart(btn.current, product.image);
    add({ kind: "makeup", makeupId: product.id, name: product.name, image: product.image, unitPrice: product.price, qty: 1, maxQty: makeupMaxQty(product) });
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  };

  const label = soldOut ? "Agotado" : added ? "¡Sumado!" : full ? "Ya tenés todas" : "Sumar al carrito";
  // Lo que se anuncia al sumar: cambia con cada unidad, así el lector de pantalla lo vuelve a leer.
  const announce = added ? `Sumaste ${product.name}. Tenés ${inCart} en el carrito${full ? ", no quedan más" : ""}.` : "";

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={onAdd}
        // agotado: no se puede tocar. Lleno: queda enfocable (si se deshabilita bajo el foco, el teclado pierde su lugar)
        disabled={soldOut}
        aria-disabled={full || undefined}
        data-cursor={soldOut || full ? undefined : "sumar"}
        className={cn(
          "rounded-pill inline-flex h-11 w-full scroll-mt-28 scroll-mb-6 items-center justify-center gap-1.5 text-[13px] font-semibold",
          "transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "focus-visible:outline-bordo focus-visible:outline-2 focus-visible:outline-offset-2",
          soldOut || full
            ? "bg-cream-deep text-ink-soft cursor-not-allowed"
            : added
              ? "bg-lip text-cream active:scale-[0.97]"
              : "bg-bordo text-cream hover:bg-lip active:scale-[0.97]",
          className,
        )}
      >
        {!soldOut && !full && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            {added ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}
          </svg>
        )}
        {/* el texto visible va primero en el nombre (lo que se dice en voz alta coincide con lo que se ve) */}
        <span>{label}</span>
        <span className="sr-only">: {product.name}</span>
      </button>
      <span role="status" className="sr-only">
        {announce}
      </span>
    </>
  );
}
