import type { BuilderSelection } from "@/lib/types";

/**
 * Cada diseño del catálogo traducido al armador, como lo armaría Brenda: base del set (forma, largo, acabado,
 * color y técnicas de las 10 uñas) y uñas acento (cuáles, de qué color y qué llevan solo ellas). Sirve para
 * "Partí de un diseño de Brenda" en el armador y para "Modificalo en el armador" en la ficha.
 *
 * Es una aproximación de la vista previa: el set real lo pinta Brenda a mano. Un test chequea que cada diseño
 * del catálogo tenga su receta y que todas sus técnicas y colores existan en el armador.
 */
export const PRESETS: Record<string, BuilderSelection> = {
  "pink-dots": {
    shape: "cuadrada", length: "largo", finish: "glossy", base: "fucsia", extras: [],
    accent: "alternadas", accentColor: "nude", accentExtras: ["puntitos"], detailColor: "fucsia",
  },
  "lila-perlas": {
    shape: "cuadrada", length: "largo", finish: "glossy", base: "lila", extras: [],
    accent: "anular-mayor", accentExtras: ["perlas"],
  },
  "black-snake": {
    shape: "almendra", length: "largo", finish: "glossy", base: "negro", extras: ["cat-eye"],
    accent: "anular", accentColor: "nude", accentExtras: ["strass"],
  },
  "black-stiletto": {
    shape: "stiletto", length: "xl", finish: "glossy", base: "negro", extras: ["cat-eye"],
    accent: "anular-mayor", accentColor: "rosa", accentExtras: ["degrade"], degradeColor: "negro",
  },
  "black-leo": {
    shape: "almendra", length: "largo", finish: "glossy", base: "negro", extras: [],
    accent: "pulgar-menique", accentColor: "nude", accentExtras: ["animal-print"],
  },
  "french-glitter": {
    shape: "cuadrada", length: "largo", finish: "glossy", base: "nude", extras: ["francesita", "glitter"],
  },
  "verde-oliva": { shape: "almendra", length: "largo", finish: "glossy", base: "verde", extras: [] },
  violeta: { shape: "almendra", length: "largo", finish: "glossy", base: "violeta", extras: [] },
  "pink-babyboomer": {
    shape: "almendra", length: "largo", finish: "glossy", base: "rosa", extras: ["degrade", "glitter"],
  },
  "pink-wave": {
    shape: "cuadrada", length: "xl", finish: "glossy", base: "rosa", extras: ["ondas", "glitter"], detailColor: "fucsia",
    accent: "anular", accentExtras: ["strass"],
  },
  "milky-star": {
    shape: "almendra", length: "largo", finish: "glossy", base: "milky", extras: [],
    accent: "anular", accentExtras: ["estrellas", "puntitos"], detailColor: "dorado",
  },
  "leo-cherry": {
    shape: "almendra", length: "medio", finish: "glossy", base: "rojo", extras: [],
    accent: "anular-mayor", accentColor: "nude", accentExtras: ["animal-print"],
  },
  "sunset-french": {
    shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: ["francesita-color"], tipColor: "amarillo",
    accent: "anular-mayor", accentColor: "naranja", accentExtras: ["degrade"], degradeColor: "rosa",
  },
  "bordo-cat-eye": { shape: "almendra", length: "largo", finish: "glossy", base: "bordo", extras: ["cat-eye"] },
  "leo-star-gold": {
    shape: "cuadrada", length: "xl", finish: "glossy", base: "nude", extras: ["francesita", "strass"],
    accent: "alternadas", accentExtras: ["animal-print", "estrellas"], detailColor: "rosa",
  },
  "tribal-french": {
    shape: "cuadrada", length: "xl", finish: "glossy", base: "nude", extras: ["francesita", "tribal"], detailColor: "negro",
    accent: "anular", accentExtras: ["strass"],
  },
  "black-french": {
    shape: "cuadrada", length: "xl", finish: "glossy", base: "nude", extras: ["francesita-color", "strass"], tipColor: "negro",
  },
  "pink-zebra": {
    shape: "almendra", length: "largo", finish: "glossy", base: "rosa", extras: ["cebra", "glitter"], detailColor: "rojo",
  },
  "candy-gems": {
    shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: ["francesita", "strass-colores"],
  },
  "sunset-aurora": {
    shape: "almendra", length: "corto", finish: "glossy", base: "naranja", extras: ["degrade", "aurora"], degradeColor: "rosa",
  },
  "milky-pearl": {
    shape: "stiletto", length: "largo", finish: "glossy", base: "milky", extras: [],
    accent: "anular", accentExtras: ["perlas"],
  },
  "milky-gold": {
    shape: "almendra", length: "corto", finish: "glossy", base: "milky", extras: ["francesita", "encapsulado"],
    accent: "anular", accentExtras: ["strass"],
  },
  babyboomer: {
    shape: "cuadrada", length: "corto", finish: "glossy", base: "rosa", extras: ["degrade"],
    accent: "anular", accentExtras: ["strass"],
  },
  "gold-glitter": { shape: "cuadrada", length: "medio", finish: "glossy", base: "dorado", extras: ["glitter"] },
};

export function presetFor(slug: string | null | undefined): BuilderSelection | null {
  if (!slug) return null;
  const p = PRESETS[slug];
  return p ? { ...p, extras: [...p.extras], accentExtras: p.accentExtras ? [...p.accentExtras] : undefined } : null;
}
