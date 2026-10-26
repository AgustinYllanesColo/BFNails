import type { BuilderSelection, Complexity, Design, Finish, Length, Quote, Shape } from "./types";
import type { Charm } from "./data/content";
import { NAIL_COUNT, allNails, describeNailList, handOf } from "./nails";

/**
 * Motor de precios del armador. Es una función pura: la misma config y selección
 * siempre da el mismo resultado. La config se edita desde el admin.
 *
 * Modelo: precio base + delta por largo + técnicas. Cada técnica tiene una unidad (lista de precios de Brenda):
 * - "mano": se cobra por cada mano que la lleve en 2 o más uñas; en una sola uña de una mano, el precio de una uña
 *   (`nailDelta`, por defecto la mitad del precio por mano).
 * - "uña": se cobra por cada uña que la lleve (los diseños).
 * - "set": se cobra una vez, vaya donde vaya (apliques como los strass hasta 10).
 * Cada técnica suma "puntos de complejidad"; los puntos definen el nivel (1–4) y cada nivel agrega un recargo fijo
 * ("trabajo de detalle").
 */

export type ExtraUnit = "mano" | "uña" | "set";
export const UNIT_LABEL: Record<ExtraUnit, string> = { mano: "por mano", uña: "por uña", set: "por set" };

export type Option<T extends string = string> = {
  id: T;
  label: string;
  delta: number; // en técnicas: precio por unidad (mano, uña o set)
  description?: string;
  complexity?: number; // puntos
  /** Técnicas: cómo se cobra el delta. Si falta, por mano. */
  unit?: ExtraUnit;
  /** Técnicas por mano: precio cuando en una mano va en una sola uña. Si falta, la mitad del precio por mano. */
  nailDelta?: number;
  /**
   * Brenda la sacó del armador: no se ofrece, pero se sigue cobrando y dibujando si viene en una receta del catálogo
   * o en un carrito guardado.
   */
  retired?: boolean;
};

export type ComplexityTier = {
  level: Complexity;
  label: string;
  minPoints: number;
  surcharge: number;
};

export type BuilderConfig = {
  basePrice: number;
  shapes: Option<Shape>[];
  lengths: Option<Length>[];
  finishes: Option<Finish>[];
  bases: Array<Option & { hex: string }>;
  extras: Array<Option & { group: string }>;
  tiers: ComplexityTier[];
  /** Dijes disponibles (se cargan desde el admin); cada uno suma su precio por unidad. */
  charms?: Charm[];
};

export const DEFAULT_BUILDER_CONFIG: BuilderConfig = {
  basePrice: 12000,
  shapes: [
    // Bren hace estas cuatro (ovalada no) y todas salen lo mismo
    { id: "almendra", label: "Almendra", delta: 0 },
    { id: "cuadrada", label: "Cuadrada", delta: 0 },
    { id: "coffin", label: "Coffin", delta: 0 },
    { id: "stiletto", label: "Stiletto", delta: 0 },
  ],
  lengths: [
    { id: "corto", label: "Corto", delta: 0 },
    { id: "medio", label: "Medio", delta: 0 },
    { id: "largo", label: "Largo", delta: 0 },
    { id: "xl", label: "XL", delta: 1500 },
  ],
  finishes: [
    // solo brillo o mate
    { id: "glossy", label: "Brillo", delta: 0 },
    { id: "mate", label: "Mate", delta: 0 },
  ],
  bases: [
    { id: "nude", label: "Nude", delta: 0, hex: "#e8c4b0" },
    { id: "milky", label: "Milky", delta: 0, hex: "#f6efe6" },
    { id: "rojo", label: "Rojo", delta: 0, hex: "#b51c1c" },
    { id: "bordo", label: "Bordó", delta: 0, hex: "#4a0e0e" },
    { id: "negro", label: "Negro", delta: 0, hex: "#1d1d1d" },
    { id: "blanco", label: "Blanco", delta: 0, hex: "#ffffff" },
    { id: "rosa", label: "Rosa", delta: 0, hex: "#f2a7c3" },
    { id: "lila", label: "Lila", delta: 0, hex: "#c6a4e6" },
    { id: "celeste", label: "Celeste", delta: 0, hex: "#a8d5f2" },
    { id: "verde", label: "Verde", delta: 0, hex: "#6f9a6b" },
    { id: "oliva", label: "Verde oliva", delta: 0, hex: "#9aa565" },
    { id: "chocolate", label: "Chocolate", delta: 0, hex: "#5a3a2a" },
    { id: "transparente", label: "Transparente", delta: 0, hex: "#f8f5ef" },
    { id: "fucsia", label: "Fucsia", delta: 0, hex: "#e0337f" },
    { id: "violeta", label: "Violeta", delta: 0, hex: "#8a4fc8" },
    { id: "amarillo", label: "Amarillo", delta: 0, hex: "#f5c84a" },
    { id: "naranja", label: "Naranja", delta: 0, hex: "#f2853a" },
    { id: "dorado", label: "Dorado", delta: 0, hex: "#c9a24a" },
  ],
  extras: [
    // lista de precios de Brenda (octubre 2026). Las `retired` las sacó del armador (quedan para el catálogo).
    { id: "francesita", group: "Clásicos", label: "Francesita", delta: 1500, unit: "mano", complexity: 1 },
    { id: "degrade", group: "Clásicos", label: "Degradé / babyboomer", delta: 2000, unit: "mano", complexity: 1 },
    { id: "glitter", group: "Brillos", label: "Glitter", delta: 1200, unit: "mano", complexity: 1 },
    { id: "cat-eye", group: "Brillos", label: "Cat eye", delta: 1200, unit: "mano", complexity: 1 },
    { id: "aura", group: "Brillos", label: "Aura", delta: 1700, unit: "mano", complexity: 1 },
    { id: "aurora", group: "Brillos", label: "Efecto aurora / espejo", delta: 1500, unit: "mano", complexity: 1 },
    { id: "cromado", group: "Brillos", label: "Cromado", delta: 500, unit: "uña", complexity: 1 },
    { id: "strass", group: "3D y apliques", label: "Strass (hasta 10)", delta: 1200, unit: "set", complexity: 1 },
    { id: "strass-full", group: "3D y apliques", label: "Strass full", delta: 5000, unit: "set", complexity: 2, retired: true },
    { id: "strass-colores", group: "3D y apliques", label: "Gemas de colores", delta: 2500, unit: "set", complexity: 1, retired: true },
    { id: "perlas", group: "3D y apliques", label: "Perlado", delta: 2500, unit: "set", complexity: 1, retired: true },
    { id: "cadenas", group: "3D y apliques", label: "Cadenitas doradas", delta: 2500, unit: "set", complexity: 1, retired: true },
    { id: "flor-3d", group: "3D y apliques", label: "Flor 3D", delta: 1500, unit: "uña", complexity: 2 },
    { id: "3d", group: "3D y apliques", label: "Relieve 3D (moños, flores)", delta: 1200, unit: "uña", complexity: 2, retired: true },
    { id: "animal-print", group: "Diseños", label: "Animal print", delta: 400, unit: "uña", complexity: 2 },
    { id: "carey", group: "Diseños", label: "Carey", delta: 450, unit: "uña", complexity: 2 },
    { id: "flores", group: "Diseños", label: "Flores a mano alzada", delta: 600, unit: "uña", complexity: 2, retired: true },
    { id: "puntitos", group: "Diseños", label: "Puntitos", delta: 250, unit: "uña", complexity: 1 },
    { id: "cebra", group: "Diseños", label: "Cebra / tigre", delta: 400, unit: "uña", complexity: 2 },
    { id: "ondas", group: "Diseños", label: "Ondas", delta: 400, unit: "uña", complexity: 1 },
    { id: "estrellas", group: "Diseños", label: "Estrellitas", delta: 400, unit: "uña", complexity: 1 },
    { id: "tribal", group: "Diseños", label: "Tribal", delta: 500, unit: "uña", complexity: 2, retired: true },
    { id: "blooming", group: "Diseños", label: "Blooming", delta: 300, unit: "uña", complexity: 1 },
    { id: "personajes", group: "Diseños", label: "Personajes (Kitty & cía)", delta: 800, unit: "uña", complexity: 3, retired: true },
    { id: "a-mano", group: "Diseños", label: "Dibujo a mano alzada", delta: 900, unit: "uña", complexity: 3, retired: true },
    { id: "encapsulado", group: "Diseños", label: "Encapsulado (flores secas, foil)", delta: 600, unit: "uña", complexity: 2, retired: true },
  ],
  tiers: [
    { level: 1, label: "Simple", minPoints: 0, surcharge: 0 },
    { level: 2, label: "Intermedio", minPoints: 2, surcharge: 1000 },
    { level: 3, label: "Elaborado", minPoints: 4, surcharge: 2500 },
    { level: 4, label: "Premium", minPoints: 7, surcharge: 5000 },
  ],
};

/**
 * Precio de un diseño del catálogo en otra forma o largo: al precio del diseño se le suma la
 * diferencia de delta entre lo elegido y lo que trae el diseño (una forma más cara suma, una
 * más barata no descuenta por debajo del precio del diseño).
 */
export function designVariantPrice(
  design: Pick<Design, "price" | "shape" | "length">,
  shape: Shape | undefined,
  length: Length | undefined,
  config: BuilderConfig = DEFAULT_BUILDER_CONFIG,
): number {
  const delta = <T extends string>(list: Option<T>[], id: T | undefined, base: T) => {
    const d = (x: T) => list.find((o) => o.id === x)?.delta ?? 0;
    return id ? d(id) - d(base) : 0;
  };
  const extra =
    delta(config.shapes, shape, design.shape) + delta(config.lengths, length, design.length);
  return design.price + Math.max(0, extra);
}

export function tierForPoints(points: number, tiers: ComplexityTier[]): ComplexityTier {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0];
  for (const t of sorted) if (points >= t.minPoints) current = t;
  return current;
}

export function quoteSelection(
  sel: BuilderSelection,
  config: BuilderConfig = DEFAULT_BUILDER_CONFIG,
): Quote {
  const lines: Quote["lines"] = [
    { id: "base", label: "Set base (10 uñas + kit de colocación)", amount: config.basePrice },
  ];
  let points = 0;

  const pick = <T extends string>(opts: Option<T>[], id: T, label: string) => {
    const opt = opts.find((o) => o.id === id);
    if (!opt) return;
    points += opt.complexity ?? 0;
    if (opt.delta !== 0)
      lines.push({ id: `${label}:${opt.id}`, label: `${label}: ${opt.label}`, amount: opt.delta });
  };

  pick(config.shapes, sel.shape, "Forma");
  pick(config.lengths, sel.length, "Largo");
  pick(config.finishes, sel.finish, "Acabado");

  const base = config.bases.find((b) => b.id === sel.base);
  if (base && base.delta !== 0)
    lines.push({ id: `base-color:${base.id}`, label: `Color: ${base.label}`, amount: base.delta });

  // técnicas: precio por mano. Las que van en las 10 uñas se nombran solas; las demás, con dónde van.
  const specs = allNails(normalizeSelection(sel));
  const where = new Map<string, number[]>();
  specs.forEach((sp, i) => {
    for (const id of new Set(sp.extras)) where.set(id, [...(where.get(id) ?? []), i]);
  });
  for (const extra of config.extras) {
    const nails = where.get(extra.id);
    if (!nails?.length) continue;
    points += extra.complexity ?? 0;
    const label = nails.length === NAIL_COUNT ? extra.label : `${extra.label} (${describeNailList(nails)})`;
    lines.push({ id: `extra:${extra.id}`, label, amount: extraPrice(extra, nails) });
  }

  for (const pick of sel.charms ?? []) {
    const charm = config.charms?.find((c) => c.id === pick.id);
    if (!charm || pick.qty <= 0) continue;
    lines.push({ id: `charm:${charm.id}`, label: `Dije ${charm.name} ×${pick.qty}`, amount: charm.price * pick.qty });
  }

  const tier = tierForPoints(points, config.tiers);
  if (tier.surcharge > 0) {
    lines.push({ id: "complexity", label: "Trabajo de detalle", amount: tier.surcharge });
  }

  const subtotal = lines.reduce((acc, l) => acc + l.amount, 0);
  const needsConfirmation = Boolean(sel.notes && sel.notes.trim().length > 0);

  return {
    lines,
    complexity: tier.level,
    complexityLabel: tier.label,
    subtotal,
    total: subtotal,
    needsConfirmation,
  };
}

/** Técnicas viejas (carritos y links guardados) traducidas a las de hoy. */
export const LEGACY_EXTRAS: Record<string, string> = { "francesita-color": "francesita" };

/** Una selección con las técnicas viejas traducidas (la francesita de color es la francesita con `tipColor`). */
export function normalizeSelection(sel: BuilderSelection): BuilderSelection {
  const fix = (list: string[] | undefined) => (list ? [...new Set(list.map((e) => LEGACY_EXTRAS[e] ?? e))] : list);
  if (![sel.extras, sel.accentExtras ?? [], ...(sel.nailDesigns ?? []).map((d) => d?.extras ?? [])].some((l) => l.some((e) => e in LEGACY_EXTRAS))) return sel;
  return {
    ...sel,
    extras: fix(sel.extras) ?? [],
    accentExtras: fix(sel.accentExtras),
    nailDesigns: sel.nailDesigns?.map((d) => (d ? { ...d, extras: fix(d.extras) } : d)),
  };
}

/** Precio de una técnica en una sola uña de una mano. */
export function nailPrice(extra: Pick<Option, "delta" | "nailDelta">): number {
  return extra.nailDelta ?? Math.ceil(extra.delta / 2 / 100) * 100;
}

/** Precio de una técnica según su unidad y en qué uñas va. */
export function extraPrice(extra: Pick<Option, "delta" | "nailDelta" | "unit">, nails: number[]): number {
  const set = new Set(nails);
  if (set.size === 0) return 0;
  if (extra.unit === "set") return extra.delta;
  if (extra.unit === "uña") return extra.delta * set.size;
  const perHand = [0, 0];
  for (const i of set) perHand[handOf(i)]++;
  return perHand.reduce((acc, n) => acc + (n === 0 ? 0 : n === 1 ? nailPrice(extra) : extra.delta), 0);
}

/** "$400/uña", "$1.500/mano" o "$1.200" (por set), para los chips del armador. */
export function extraUnitHint(extra: Pick<Option, "delta" | "unit">, format: (n: number) => string): string {
  const u = extra.unit ?? "mano";
  return u === "set" ? format(extra.delta) : `${format(extra.delta)}/${u}`;
}

export const DEFAULT_SELECTION: BuilderSelection = {
  shape: "almendra",
  length: "medio",
  finish: "glossy",
  base: "nude",
  extras: [],
};

/** Color del diseño si la clienta no eligió uno: blanco sobre bases oscuras, bordó sobre las claras. */
export function defaultDetailColor(base: string): string {
  return ["negro", "bordo", "chocolate", "verde"].includes(base) ? "blanco" : "bordo";
}

// los acentos viejos (anular, pulgar y meñique…) ahora viven con el resto de la lógica uña por uña
export { ACCENT_OPTIONS, accentMode, isAccentNail } from "./nails";
