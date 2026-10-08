"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/store/cart";

/** Vacía el carrito al llegar a la página del pedido (por si el redirect de MP volvió antes). */
export function ClearCartOnMount() {
  const clear = useCart((s) => s.clear);
  useEffect(() => clear(), [clear]);
  return null;
}
