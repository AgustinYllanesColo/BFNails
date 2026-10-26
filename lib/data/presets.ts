import type { BuilderSelection } from "@/lib/types";

/**
 * Cada diseño del catálogo traducido al armador, como lo armaría Brenda: base del set (forma, largo, acabado,
 * color y técnicas de las 10 uñas) y uñas acento (cuáles, de qué color y qué llevan solo ellas). Sirve para
 * "Partí de un diseño de Brenda" en el armador y para "Modificalo en el armador" en la ficha.
 *
 * Los dijes son los de verdad (lib/data/content.ts), en las uñas donde los pone Brenda.
 *
 * Es una aproximación de la vista previa: el set real lo pinta Brenda a mano. Un test chequea que cada diseño
 * del catálogo tenga su receta y que todas sus técnicas y colores existan en el armador.
 */
export const PRESETS: Record<string, BuilderSelection> = {
  // la flor va en el índice derecho y el anular izquierdo, como en la tarjeta de Brenda
  "polka-flower": {
    shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: ["francesita", "puntitos"], detailColor: "negro",
    nailDesigns: [null, { color: "nude", extras: ["francesita", "puntitos", "flor-3d"] }, null, null, null, null, null, null, { color: "nude", extras: ["francesita", "puntitos", "flor-3d"] }, null],
  },
  "pink-dots": {
    shape: "cuadrada", length: "medio", finish: "glossy", base: "fucsia", extras: [],
    accent: "alternadas", accentColor: "nude", accentExtras: ["puntitos"], detailColor: "fucsia",
  },
  "lila-perlas": {
    shape: "cuadrada", length: "medio", finish: "glossy", base: "lila", extras: [],
    accent: "anular", accentExtras: ["perlas"],
  },
  "black-snake": {
    shape: "almendra", length: "medio", finish: "glossy", base: "negro", extras: [],
    nailDesigns: [null, { color: "nude", extras: [] }, null, { color: "dorado", extras: ["glitter"] }, null, null, { color: "nude", extras: [] }, null, { color: "dorado", extras: ["glitter"] }, null],
    charms: [{ id: "serpiente-dorada", qty: 2, nails: [1, 6] }],
  },
  "black-stiletto": {
    shape: "stiletto", length: "largo", finish: "glossy", base: "negro", extras: [],
    nailDesigns: [null, { color: "rosa", extras: ["degrade"] }, null, null, null, null, { color: "rosa", extras: ["degrade"] }, null, null, null],
    degradeColor: "negro",
  },
  "black-leo": {
    shape: "almendra", length: "medio", finish: "glossy", base: "negro", extras: [],
    accent: "pulgar-menique", accentColor: "nude", accentExtras: ["animal-print"],
  },
  "french-glitter": {
    shape: "cuadrada", length: "medio", finish: "glossy", base: "nude", extras: ["francesita", "glitter"],
  },
  "verde-oliva": { shape: "almendra", length: "medio", finish: "glossy", base: "oliva", extras: [] },
  violeta: { shape: "almendra", length: "medio", finish: "glossy", base: "violeta", extras: [] },
  "pink-babyboomer": {
    shape: "almendra", length: "medio", finish: "glossy", base: "rosa", extras: ["degrade", "glitter"],
  },
  "pink-wave": {
    shape: "cuadrada", length: "largo", finish: "glossy", base: "rosa", extras: ["ondas", "glitter", "strass"], detailColor: "fucsia",
  },
  "milky-star": {
    shape: "almendra", length: "medio", finish: "glossy", base: "milky", extras: [],
    accent: "anular", accentExtras: ["estrellas", "puntitos"], detailColor: "dorado",
  },
  "leo-cherry": {
    shape: "almendra", length: "medio", finish: "glossy", base: "rojo", extras: [],
    accent: "anular-mayor", accentColor: "nude", accentExtras: ["animal-print"],
  },
  "sunset-french": {
    shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: ["francesita"], tipColor: "amarillo",
    accent: "anular-mayor", accentColor: "naranja", accentExtras: ["degrade"], degradeColor: "rosa",
  },
  "bordo-aura": { shape: "almendra", length: "medio", finish: "glossy", base: "bordo", extras: ["aura"] },
  "leo-star-gold": {
    shape: "cuadrada", length: "xl", finish: "glossy", base: "nude", extras: ["strass", "estrellas"], detailColor: "rosa",
    // pulgar y meñique milky con cadenas y leopardo, índice francesita rosa con tachas, mayor blanco con destellos dorados
    nailDesigns: [
      { color: "milky", extras: ["cadenas", "animal-print"] }, { color: "nude", extras: ["francesita", "strass"] }, { color: "blanco", extras: ["estrellas"] }, null, { color: "milky", extras: ["cadenas", "animal-print"] },
      { color: "milky", extras: ["cadenas", "animal-print"] }, { color: "nude", extras: ["francesita", "strass"] }, { color: "blanco", extras: ["estrellas"] }, null, { color: "milky", extras: ["cadenas", "animal-print"] },
    ],
    tipColor: "rosa",
  },
  "tribal-french": {
    shape: "cuadrada", length: "xl", finish: "glossy", base: "nude", extras: ["francesita", "tribal", "strass"], detailColor: "negro",
  },
  "black-french": {
    shape: "cuadrada", length: "largo", finish: "glossy", base: "nude", extras: ["francesita", "strass"], tipColor: "negro",
  },
  "pink-zebra": {
    shape: "almendra", length: "medio", finish: "glossy", base: "rosa", extras: ["cat-eye", "cebra"], detailColor: "rojo",
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
    charms: [{ id: "piercing", qty: 2, nails: [2, 7] }],
  },
  "milky-gold": {
    shape: "almendra", length: "corto", finish: "glossy", base: "milky", extras: ["francesita", "encapsulado"],
    accent: "anular", accentExtras: ["strass"],
  },
  babyboomer: {
    shape: "cuadrada", length: "corto", finish: "glossy", base: "rosa", extras: ["degrade"],
    accent: "anular", accentExtras: ["strass"],
  },
  "gold-glitter": { shape: "cuadrada", length: "medio", finish: "glossy", base: "dorado", extras: ["cat-eye", "glitter"] },
  // pulgar, mayor y meñique nude con francesita de glitter; índice y anular cat eye plata con relieve (el anular con strass)
  "silver-cat-eye": {
    shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: ["francesita", "glitter"], tipColor: "blanco",
    nailDesigns: [
      null, { color: "celeste", extras: ["cat-eye", "3d"] }, null, { color: "celeste", extras: ["cat-eye", "3d", "strass"] }, null,
      null, { color: "celeste", extras: ["cat-eye", "3d"] }, null, { color: "celeste", extras: ["cat-eye", "3d", "strass"] }, null,
    ],
  },
  // cada uña distinta: cocodrilo rojo, estrella con strass, francesita de leopardo, babyboomer con glitter, francesita roja con estrella
  "pink-mix": {
    shape: "almendra", length: "medio", finish: "glossy", base: "rosa", extras: [], tipColor: "rojo", detailColor: "rosa", degradeColor: "blanco",
    nailDesigns: [
      { color: "rojo", extras: ["ondas"] }, { color: "naranja", extras: ["estrellas", "strass"] }, { color: "naranja", extras: ["francesita", "animal-print"] }, { color: "rosa", extras: ["degrade", "glitter"] }, { color: "nude", extras: ["francesita", "estrellas", "strass"] },
      { color: "rojo", extras: ["ondas"] }, { color: "naranja", extras: ["estrellas", "strass"] }, { color: "naranja", extras: ["francesita", "animal-print"] }, { color: "rosa", extras: ["degrade", "glitter"] }, { color: "nude", extras: ["francesita", "estrellas", "strass"] },
    ],
  },
  // francesita roja sobre nude; pulgar y anular rojos enteros; el mayor con estrella dorada
  "cherry-french": {
    shape: "almendra", length: "largo", finish: "glossy", base: "nude", extras: ["francesita"], tipColor: "rojo", detailColor: "dorado",
    nailDesigns: [
      { color: "rojo", extras: [] }, null, { extras: ["francesita", "estrellas"] }, { color: "rojo", extras: [] }, null,
      { color: "rojo", extras: [] }, null, { extras: ["francesita", "estrellas"] }, { color: "rojo", extras: [] }, null,
    ],
  },
};

/**
 * Diseños que el armador no llega a reproducir (trabajo a mano de Brenda que no sale parecido con las técnicas de la
 * vista previa): la receta existe, pero no se ofrecen en "Partí de un diseño" ni en "Modificalo en el armador".
 */
export const PRESET_HIDDEN = new Set(["leo-star-gold", "milky-pearl", "lila-perlas", "tribal-french", "candy-gems", "milky-gold", "silver-cat-eye", "pink-mix"]);

export function presetVisible(slug: string): boolean {
  return Boolean(PRESETS[slug]) && !PRESET_HIDDEN.has(slug);
}

export function presetFor(slug: string | null | undefined): BuilderSelection | null {
  if (!slug) return null;
  const p = PRESETS[slug];
  return p
    ? {
        ...p,
        art: slug,
        from: slug,
        extras: [...p.extras],
        accentExtras: p.accentExtras ? [...p.accentExtras] : undefined,
        charms: p.charms?.map((c) => ({ ...c, nails: c.nails ? [...c.nails] : undefined })),
        nailDesigns: p.nailDesigns?.map((d) => (d ? { ...d, extras: d.extras ? [...d.extras] : undefined } : null)),
      }
    : null;
}
