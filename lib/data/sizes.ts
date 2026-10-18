import type { StandardSize } from "@/lib/types";

export const FINGERS = [
  "Pulgar",
  "Índice",
  "Medio",
  "Anular",
  "Meñique",
] as const;

/**
 * Medidas universales S, M y L: las de los sets en stock, de entrega inmediata. Ancho de cada uña en mm, según la
 * tabla de Brenda (ella la publica en cm: 1,5 · 1,1 · 1,2 · 1,1 · 0,9 para la S). Orden: pulgar, índice, medio,
 * anular, meñique. `tips` es la numeración aproximada de los tips (0 el más ancho).
 */
export const STANDARD_SIZES: Record<StandardSize, { tips: number[]; widthMm: number[]; hint: string }> = {
  S: { tips: [2, 6, 5, 6, 9], widthMm: [15, 11, 12, 11, 9], hint: "Chicas" },
  M: { tips: [1, 5, 4, 5, 8], widthMm: [16, 12, 13, 12, 10], hint: "Medianas" },
  L: { tips: [0, 4, 3, 4, 7], widthMm: [17, 13, 14, 13, 11], hint: "Grandes" },
};

export const SIZE_ORDER: StandardSize[] = ["S", "M", "L"];

/** Sugiere una medida universal a partir del ancho del pulgar y del anular (en mm). */
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
