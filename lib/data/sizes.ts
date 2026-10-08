import type { StandardSize } from "@/lib/types";

export const FINGERS = [
  "Pulgar",
  "Índice",
  "Mayor",
  "Anular",
  "Meñique",
] as const;

/**
 * Tabla de talles estándar (numeración de tips 0–9, donde 0 es el más ancho).
 * Orden: pulgar, índice, mayor, anular, meñique.
 * A VALIDAR CON BRENDA: estos valores son el estándar más común de kits
 * press-on y pueden ajustarse a los tips que ella usa.
 */
export const STANDARD_SIZES: Record<StandardSize, { tips: number[]; widthMm: number[]; hint: string }> = {
  XS: { tips: [2, 6, 5, 7, 9], widthMm: [15.5, 12.5, 13, 12, 10], hint: "Manos muy chicas" },
  S: { tips: [1, 5, 4, 6, 9], widthMm: [16.5, 13, 13.5, 12.5, 10.5], hint: "La más pedida" },
  M: { tips: [0, 4, 3, 5, 8], widthMm: [17.5, 13.5, 14.5, 13, 11], hint: "Manos medianas" },
  L: { tips: [0, 3, 2, 4, 7], widthMm: [18.5, 14.5, 15.5, 14, 12], hint: "Manos grandes" },
};

export const SIZE_ORDER: StandardSize[] = ["XS", "S", "M", "L"];

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
