"use client";

import { useRef, useState } from "react";
import type { Charm } from "@/lib/data/content";
import { useCart } from "@/lib/store/cart";
import { flyToCart } from "@/components/motion/flyToCart";

/** Botón para llevar un dije suelto (por unidad). Si ya está en el carrito, suma uno más. */
export function AddCharmToCart({ charm }: { charm: Charm }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  const onAdd = () => {
    flyToCart(btn.current, charm.image);
    add({ kind: "charm", charmId: charm.id, name: charm.name, image: charm.image, unitPrice: charm.price, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <button
      ref={btn}
      type="button"
      onClick={onAdd}
      aria-label={`Sumar ${charm.name} al carrito`}
      data-cursor="sumar"
      className="rounded-pill bg-cream-deep text-bordo ring-bordo/10 hover:bg-bordo hover:text-cream mt-2 h-8 w-full text-xs font-semibold ring-1 transition-colors active:scale-95"
    >
      {added ? "¡Sumado! ✦" : "+ Al carrito"}
    </button>
  );
}
