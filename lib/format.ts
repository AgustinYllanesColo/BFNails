import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatARS(amount: number): string {
  return ars.format(Math.round(amount));
}

/**
 * Partes del precio para componerlo tipográficamente (signo chico, número tabular).
 * `formatARSParts(22000)` → `{ sign: "$", number: "22.000" }`; los negativos llevan el signo menos en `sign` ("-$").
 */
export function formatARSParts(amount: number): { sign: string; number: string } {
  let sign = "";
  let number = "";
  for (const part of ars.formatToParts(Math.round(amount))) {
    if (part.type === "minusSign" || part.type === "currency") sign += part.value;
    else if (part.type !== "literal") number += part.value;
  }
  return { sign, number };
}

/**
 * tailwind-merge con la escala propia de `app/globals.css`. Sin este `extend`, `text-h2` se toma como un color y
 * `cn("text-h2", "text-bordo")` borraría uno de los dos; lo mismo con `rounded-pill` o `shadow-sticker`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h1", "h2", "h3", "title", "lead", "body", "meta", "label", "price"],
      radius: ["xs", "sm", "md", "lg", "xl", "pill"],
      shadow: ["xs", "sm", "md", "lg", "xl", "sticker", "press", "device", "bar-inverse", "drop"],
      "drop-shadow": ["logo"],
      ease: ["ui", "move", "drawer", "out-expo", "bounce"],
      animate: [
        "rise-in",
        "fade-in",
        "pop-in",
        "twinkle",
        "logo-float",
        "pendulum",
        "bounce-y",
        "peek-idle",
        "spin-slow",
      ],
    },
  },
});

/** Une clases condicionales y resuelve conflictos de Tailwind (la última gana): `cn("py-20", cond && "py-0")`. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
