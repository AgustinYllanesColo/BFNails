import type { BuilderSelection, Complexity, Finish, Length, Quote, Shape } from "./types";

/**
 * Motor de precios del armador. Es una función pura: la misma config y selección
 * siempre da el mismo resultado. La config se edita desde el admin.
 *
 * Modelo: precio base + delta por forma/largo/acabado + extras.
 * Cada extra suma "puntos de complejidad"; los puntos definen el nivel (1–4) y
 * cada nivel agrega un recargo fijo, que es la forma de reflejar el "a ojo"
 * de Brenda de manera consistente.
 */

export type Option<T extends string = string> = {
  id: T;
  label: string;
  delta: number;
  description?: string;
  complexity?: number; // puntos
};

export type ComplexityTier = { level: Complexity; label: string; minPoints: number; surcharge: number };

export type BuilderConfig = {
  basePrice: number;
  shapes: Option<Shape>[];
  lengths: Option<Length>[];
  finishes: Option<Finish>[];
  bases: Array<Option & { hex: string }>;
  extras: Array<Option & { group: string }>;
  tiers: ComplexityTier[];
};

export const DEFAULT_BUILDER_CONFIG: BuilderConfig = {
  basePrice: 12000,
  shapes: [
    { id: "almendra", label: "Almendra", delta: 0 },
    { id: "ovalada", label: "Ovalada", delta: 0 },
    { id: "cuadrada", label: "Cuadrada", delta: 0 },
    { id: "coffin", label: "Coffin", delta: 500 },
    { id: "stiletto", label: "Stiletto", delta: 800 },
  ],
  lengths: [
    { id: "corto", label: "Corto", delta: 0 },
    { id: "medio", label: "Medio", delta: 0 },
    { id: "largo", label: "Largo", delta: 1000 },
    { id: "xl", label: "XL", delta: 2000 },
  ],
  finishes: [
    { id: "glossy", label: "Glossy", delta: 0 },
    { id: "mate", label: "Mate", delta: 500 },
    { id: "cromado", label: "Cromado", delta: 2500, complexity: 1 },
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
    { id: "chocolate", label: "Chocolate", delta: 0, hex: "#5a3a2a" },
    { id: "transparente", label: "Transparente", delta: 0, hex: "#f8f5ef" },
  ],
  extras: [
    { id: "francesita", group: "Clásicos", label: "Francesita", delta: 1500, complexity: 1 },
    { id: "francesita-color", group: "Clásicos", label: "Francesita de color", delta: 2000, complexity: 1 },
    { id: "degrade", group: "Clásicos", label: "Degradé / babyboomer", delta: 2000, complexity: 1 },
    { id: "glitter", group: "Brillos", label: "Glitter", delta: 1200, complexity: 1 },
    { id: "cat-eye", group: "Brillos", label: "Cat eye", delta: 1800, complexity: 1 },
    { id: "aurora", group: "Brillos", label: "Efecto aurora / espejo", delta: 2200, complexity: 1 },
    { id: "strass", group: "3D y apliques", label: "Strass (hasta 10)", delta: 2000, complexity: 1 },
    { id: "strass-full", group: "3D y apliques", label: "Strass full", delta: 5000, complexity: 2 },
    { id: "charms", group: "3D y apliques", label: "Charms / dijes", delta: 2500, complexity: 2 },
    { id: "3d", group: "3D y apliques", label: "Relieve 3D (moños, flores)", delta: 3500, complexity: 2 },
    { id: "animal-print", group: "Diseños", label: "Animal print", delta: 2500, complexity: 2 },
    { id: "flores", group: "Diseños", label: "Flores a mano", delta: 3000, complexity: 2 },
    { id: "personajes", group: "Diseños", label: "Personajes (Kitty & cía)", delta: 4000, complexity: 3 },
    { id: "a-mano", group: "Diseños", label: "Dibujo a mano alzada", delta: 4500, complexity: 3 },
    { id: "encapsulado", group: "Diseños", label: "Encapsulado (flores secas, foil)", delta: 3000, complexity: 2 },
  ],
  tiers: [
    { level: 1, label: "Simple", minPoints: 0, surcharge: 0 },
    { level: 2, label: "Intermedio", minPoints: 2, surcharge: 1000 },
    { level: 3, label: "Elaborado", minPoints: 4, surcharge: 2500 },
    { level: 4, label: "Premium", minPoints: 7, surcharge: 5000 },
  ],
};

export function tierForPoints(points: number, tiers: ComplexityTier[]): ComplexityTier {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0];
  for (const t of sorted) if (points >= t.minPoints) current = t;
  return current;
}

export function quoteSelection(sel: BuilderSelection, config: BuilderConfig = DEFAULT_BUILDER_CONFIG): Quote {
  const lines: Quote["lines"] = [{ id: "base", label: "Set base (10 uñas + pegamento + lima)", amount: config.basePrice }];
  let points = 0;

  const pick = <T extends string>(opts: Option<T>[], id: T, label: string) => {
    const opt = opts.find((o) => o.id === id);
    if (!opt) return;
    points += opt.complexity ?? 0;
    if (opt.delta !== 0) lines.push({ id: `${label}:${opt.id}`, label: `${label}: ${opt.label}`, amount: opt.delta });
  };

  pick(config.shapes, sel.shape, "Forma");
  pick(config.lengths, sel.length, "Largo");
  pick(config.finishes, sel.finish, "Acabado");

  const base = config.bases.find((b) => b.id === sel.base);
  if (base && base.delta !== 0) lines.push({ id: `base-color:${base.id}`, label: `Color: ${base.label}`, amount: base.delta });

  for (const id of sel.extras) {
    const extra = config.extras.find((e) => e.id === id);
    if (!extra) continue;
    points += extra.complexity ?? 0;
    lines.push({ id: `extra:${extra.id}`, label: extra.label, amount: extra.delta });
  }

  const tier = tierForPoints(points, config.tiers);
  if (tier.surcharge > 0) {
    lines.push({ id: "complexity", label: `Nivel ${tier.label.toLowerCase()}`, amount: tier.surcharge });
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

export const DEFAULT_SELECTION: BuilderSelection = {
  shape: "almendra",
  length: "medio",
  finish: "glossy",
  base: "nude",
  extras: [],
};
