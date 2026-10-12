"use client";

import { create } from "zustand";
import type { IconName } from "@/components/ui/icons";

/**
 * Toasts del sitio (PLAN W1-F2.12). Un solo `<Toaster/>` montado en Providers los dibuja; cualquier componente de
 * cliente los dispara con `toast.show({ message })` (no hace falta el hook).
 *
 * ```ts
 * toast.show({ message: `${truncateName(design.name)} quedó en tu bolsita`, action: { label: "Deshacer", onClick: undo } });
 * ```
 */
export type ToastAction = { label: string; onClick: () => void };

export type ToastInput = {
  message: string;
  action?: ToastAction;
  /** ms hasta que se va solo (default 5000). El tiempo se congela mientras el puntero o el foco están encima. */
  duration?: number;
  /** Ícono opcional a la izquierda (20 px, amarillo). */
  icon?: IconName;
};

export type ToastItem = ToastInput & { id: number; duration: number };

type ToastState = {
  toasts: ToastItem[];
  show: (input: ToastInput) => number;
  dismiss: (id: number) => void;
  clear: () => void;
};

/** Más de 3 a la vez es ruido: el más viejo se va cuando entra el cuarto. */
const MAX_TOASTS = 3;
let seq = 0;

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  show: (input) => {
    const id = ++seq;
    const item: ToastItem = { ...input, id, duration: input.duration ?? 5000 };
    set((s) => ({ toasts: [...s.toasts, item].slice(-MAX_TOASTS) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** API imperativa: `toast.show({...})` devuelve el id; `toast.dismiss(id)` lo cierra antes de tiempo. */
export const toast = {
  show: (input: ToastInput) => useToasts.getState().show(input),
  dismiss: (id: number) => useToasts.getState().dismiss(id),
  clear: () => useToasts.getState().clear(),
};

/** Nombres de diseño dentro de un toast: como mucho 28 caracteres, cortados en una palabra y con "…". */
export function truncateName(name: string, max = 28): string {
  const clean = name.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
