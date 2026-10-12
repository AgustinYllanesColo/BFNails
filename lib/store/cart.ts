"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type NewCartItem = DistributiveOmit<CartItem, "id">;

/** Tope de unidades por línea (lo valida también el servidor en `lib/checkout.ts`). */
export const MAX_QTY = 10;

type CartState = {
  items: CartItem[];
  add: (item: NewCartItem) => void;
  remove: (id: string) => void;
  /**
   * Devuelve una línea quitada a su lugar ("Deshacer" del toast). Si ya volvió (doble toque) no la duplica; si el
   * carrito cambió mientras tanto, la inserta en la posición más cercana.
   */
  restore: (item: CartItem, index: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set((s) => ({ items: [...s.items, { ...item, id: uid() } as CartItem] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      restore: (item, index) =>
        set((s) => {
          if (s.items.some((i) => i.id === item.id)) return s;
          const at = Math.max(0, Math.min(index, s.items.length));
          return { items: [...s.items.slice(0, at), item, ...s.items.slice(at)] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)),
        })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0),
      count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
    }),
    { name: "bf-cart-v1" },
  ),
);
