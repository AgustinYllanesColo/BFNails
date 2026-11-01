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
  const disabled = soldOut || full;

  const onAdd = () => {
    if (disabled) return;
    flyToCart(btn.current, product.image);
    add({ kind: "makeup", makeupId: product.id, name: product.name, image: product.image, unitPrice: product.price, qty: 1 });
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  };

  const label = soldOut ? "Agotado" : added ? "¡Sumado!" : full ? "Ya tenés todas" : "Sumar al carrito";

  return (
    <button
      ref={btn}
      type="button"
      onClick={onAdd}
      disabled={disabled}
      aria-label={soldOut ? `${product.name}: agotado` : full ? `${product.name}: ya está todo el stock en tu carrito` : `Sumar ${product.name} al carrito`}
      data-cursor={disabled ? undefined : "sumar"}
      className={cn(
        "rounded-pill inline-flex h-10 w-full items-center justify-center gap-1.5 text-[13px] font-semibold",
        "transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
        "focus-visible:ring-lip/30 focus-visible:ring-4 focus-visible:outline-none",
        disabled
          ? "bg-cream-deep text-ink-soft cursor-not-allowed active:scale-100"
          : added
            ? "bg-lip text-cream"
            : "bg-bordo text-cream hover:bg-lip",
        className,
      )}
    >
      {!disabled && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {added ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}
        </svg>
      )}
      <span aria-live="polite">{label}</span>
    </button>
  );
}
