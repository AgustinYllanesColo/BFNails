"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { maxQtyFor, type CartItem } from "@/lib/types";

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type NewCartItem = DistributiveOmit<CartItem, "id">;

type CartState = {
  items: CartItem[];
  add: (item: NewCartItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  /** Precios nuevos que mandó el servidor (id del ítem → precio unitario). */
  reprice: (prices: Record<string, number>) => void;
  subtotal: () => number;
  count: () => number;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          // un dije que ya está en el carrito suma cantidad en vez de repetir la fila
          if (item.kind === "charm") {
            const same = s.items.find((i) => i.kind === "charm" && i.charmId === item.charmId);
            if (same) return { items: s.items.map((i) => (i.id === same.id ? { ...i, qty: Math.min(50, i.qty + item.qty) } : i)) };
          }
          // lo mismo con el maquillaje (el tope por stock lo pone quien agrega; el servidor lo vuelve a validar)
          if (item.kind === "makeup") {
            const same = s.items.find((i) => i.kind === "makeup" && i.makeupId === item.makeupId);
            if (same)
              return {
                items: s.items.map((i) => {
                  if (i.id !== same.id || i.kind !== "makeup") return i;
                  // el tope más nuevo manda (si el stock bajó desde que se sumó la primera vez)
                  const next = { ...i, maxQty: item.maxQty ?? i.maxQty };
                  return { ...next, qty: Math.min(maxQtyFor(next), i.qty + item.qty) };
                }),
              };
          }
          return { items: [...s.items, { ...item, id: uid() } as CartItem] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(maxQtyFor(i), qty)) } : i)),
        })),
      clear: () => set({ items: [] }),
      reprice: (prices) => set((s) => ({ items: s.items.map((i) => (prices[i.id] != null ? { ...i, unitPrice: prices[i.id] } : i)) })),
      subtotal: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0),
      count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
    }),
    { name: "bf-cart-v1" },
  ),
);
