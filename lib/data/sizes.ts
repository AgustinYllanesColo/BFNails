import type { StandardSize } from "@/lib/types";

export const FINGERS = [
  "Pulgar",
  "Índice",
  "Mayor",
  "Anular",
  "Meñique",
] as const;

/**
 * Medidas universales S, M y L (numeración de tips 0–9, donde 0 es el más ancho): las de los sets en stock, de
 * entrega inmediata. Orden: pulgar, índice, mayor, anular, meñique.
 * PROVISORIO: reemplazar por la tabla que manda Brenda.
 */
export const STANDARD_SIZES: Record<StandardSize, { tips: number[]; widthMm: number[]; hint: string }> = {
  S: { tips: [1, 5, 4, 6, 9], widthMm: [16, 12.5, 13, 12, 10], hint: "Uñas chicas" },
  M: { tips: [0, 4, 3, 5, 8], widthMm: [17.5, 13.5, 14.5, 13, 11], hint: "Uñas medianas" },
  L: { tips: [0, 3, 2, 4, 7], widthMm: [18.5, 14.5, 15.5, 14, 12], hint: "Uñas grandes" },
};

export const SIZE_ORDER: StandardSize[] = ["S", "M", "L"];

/** Sugiere un talle estándar a partir del ancho del pulgar y del anular. */
export function suggestSize(thumbMm: number, ringMm: number): StandardSize {
  let best: StandardSize = "S";
  let bestDist = Infinity;
  for (const size of SIZE_ORDER) {
    const { widthMm } = STANDARD_SIZES[size];
    const d = Math.abs(widthMm[0] - thumbMm) + Math.abs(widthMm[3] - ringMm);
    if (d < bestDist) {
      bestDist = d;
      best = size;
    }
  }
  return best;
}
