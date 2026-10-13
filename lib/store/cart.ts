"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type NewCartItem = DistributiveOmit<CartItem, "id">;

type CartState = {
  items: CartItem[];
  add: (item: NewCartItem) => void;
  remove: (id: string) => void;
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
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i)),
        })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0),
      count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
    }),
    { name: "bf-cart-v1" },
  ),
);
