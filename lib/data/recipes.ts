import type { BuilderSelection } from "@/lib/types";
import { NAIL_COUNT, allNails } from "@/lib/nails";

/**
 * Recetas de costo: qué insumos y cuántos minutos lleva el set base, cada técnica del armador y, por composición,
 * cada diseño del catálogo. Es la base para fijar precios con criterio (insumos + tiempo + detalle) en vez de a ojo.
 *
 * Los costos de pack son los de Bella Central (bellacentral.com.ar, mayorista de Once, octubre 2026); donde la tienda no
 * informa la cantidad por pack o no tiene el producto, queda anotado como estimado. Los minutos son tiempo activo de
 * trabajo (no incluyen curado ni espera, que se solapan con otros sets). Todo se corrige desde Admin → Insumos y
 * Admin → Costos sin tocar código.
 */

export type SeedSupply = {
  id: string; // estable, para las recetas; en la base los insumos tienen uuid y se enlazan por nombre
  name: string;
  unit: string; // "u", "g", "ml", "cm", "m"
  packCost: number;
  packQty: number;
  supplier?: string;
  notes?: string;
};

export const SEED_SUPPLIES: SeedSupply[] = [
  // set base
  { id: "tips", name: "Tips soft gel almendra x500 en bolsa (Paris Night)", unit: "u", packCost: 8800, packQty: 500, supplier: "Bella Central" },
  { id: "base-rubber", name: "Base rubber 10 ml (City Girl)", unit: "ml", packCost: 2500, packQty: 10, supplier: "Bella Central" },
  { id: "semi", name: "Esmalte semipermanente 10 ml (City Girl)", unit: "ml", packCost: 1800, packQty: 10, supplier: "Bella Central" },
  { id: "top", name: "Top coat UV/LED 15 ml (City Girl)", unit: "ml", packCost: 3600, packQty: 15, supplier: "Bella Central" },
  { id: "pegamento", name: "Pegamento para press-on con pincel (Nail Glue tip)", unit: "u", packCost: 850, packQty: 1, supplier: "Bella Central" },
  { id: "lima", name: "Lima mini 100/180 x25 (Charm Limit)", unit: "u", packCost: 8600, packQty: 25, supplier: "Bella Central" },
  { id: "caja", name: "Caja organizadora press-on (NAEZ)", unit: "u", packCost: 800, packQty: 1, supplier: "Bella Central" },
  { id: "consumibles", name: "Kit de preparación press-on (toallita de alcohol + adhesivos bifaz)", unit: "u", packCost: 400, packQty: 1, supplier: "Bella Central" },
  // técnicas
  { id: "gel-art", name: "Gel painting 5 ml (Eloise)", unit: "ml", packCost: 6000, packQty: 5, supplier: "Bella Central" },
  { id: "glitter", name: "Glitter para uñas (pote 5 g)", unit: "g", packCost: 1500, packQty: 5, notes: "estimado: Bella Central no lo lista" },
  { id: "cat-eye", name: "Esmalte semi cat eye 10 ml (Rimera 15)", unit: "ml", packCost: 4100, packQty: 10, supplier: "Bella Central" },
  { id: "pigmento", name: "Polvos aurora / espejo (set x6 potes, Cromo Nail)", unit: "pote", packCost: 2200, packQty: 6, supplier: "Bella Central" },
  { id: "blooming", name: "Blooming gel 15 ml (Rimera 15)", unit: "ml", packCost: 3600, packQty: 15, supplier: "Bella Central" },
  { id: "strass", name: "Strass hotfix tornasol x1440 (NAEZ)", unit: "u", packCost: 1200, packQty: 1440, supplier: "Bella Central" },
  { id: "gemas", name: "Piedras nacaradas / gemas de colores (NAEZ, ~100 u)", unit: "u", packCost: 2800, packQty: 100, supplier: "Bella Central", notes: "cantidad por pack estimada" },
  { id: "perlas", name: "Perlas y strass surtidos (NAEZ, ~200 u)", unit: "u", packCost: 1600, packQty: 200, supplier: "Bella Central", notes: "cantidad por pack estimada" },
  { id: "cadena", name: "Deco cadena x10 (City Girl)", unit: "u", packCost: 6000, packQty: 10, supplier: "Bella Central" },
  { id: "flor-organza", name: "Flores 3D con perlas (NAEZ, ~20 u)", unit: "u", packCost: 1300, packQty: 20, supplier: "Bella Central", notes: "cantidad por pack estimada" },
  { id: "foil", name: "Papel oro y plata (Paris Night, rollo ~100 cm)", unit: "cm", packCost: 2200, packQty: 100, supplier: "Bella Central", notes: "largo del rollo estimado" },
  { id: "flores-secas", name: "Flores secas surtidas (NAEZ, ~50 u)", unit: "u", packCost: 1600, packQty: 50, supplier: "Bella Central", notes: "cantidad por pack estimada" },
  { id: "pegamento-apliques", name: "Gel glue para dijes y cristales 10 ml (Charm Limit)", unit: "ml", packCost: 2000, packQty: 10, supplier: "Bella Central" },
  { id: "dije", name: "Dijes para uñas (NAEZ, pack ~20 u)", unit: "u", packCost: 1800, packQty: 20, supplier: "Bella Central", notes: "cantidad por pack estimada" },
];

export type Usage = { supplyId: string; qty: number };
export type SeedRecipe = { target: string; label: string; minutes: number; usages: Usage[] };

/** Set base: 10 uñas (más 2 tips de repuesto por talles), base, color, top, pegamento, lima, caja y consumibles. */
export const BASE_RECIPE: SeedRecipe = {
  target: "base",
  label: "Set base (10 uñas + pegamento + lima)",
  minutes: 60,
  usages: [
    { supplyId: "tips", qty: 12 },
    { supplyId: "base-rubber", qty: 1 },
    { supplyId: "semi", qty: 1 },
    { supplyId: "top", qty: 1.2 },
    { supplyId: "pegamento", qty: 1 },
    { supplyId: "lima", qty: 1 },
    { supplyId: "caja", qty: 1 },
    { supplyId: "consumibles", qty: 1 },
  ],
};

/**
 * Lo que agrega cada técnica cuando va en las 10 uñas (minutos activos e insumos). Cuando va en menos uñas, el
 * diseño escala por cantidad de uñas con un piso del 40 % (preparar el color, el pincel y limpiar se hace igual).
 */
export const TECHNIQUE_RECIPES: Record<string, { minutes: number; usages: Usage[] }> = {
  francesita: { minutes: 15, usages: [{ supplyId: "semi", qty: 0.3 }, { supplyId: "gel-art", qty: 0.2 }] },
  "francesita-color": { minutes: 15, usages: [{ supplyId: "semi", qty: 0.4 }, { supplyId: "gel-art", qty: 0.2 }] },
  degrade: { minutes: 20, usages: [{ supplyId: "semi", qty: 0.5 }, { supplyId: "consumibles", qty: 1 }] },
  glitter: { minutes: 8, usages: [{ supplyId: "glitter", qty: 0.3 }] },
  "cat-eye": { minutes: 10, usages: [{ supplyId: "cat-eye", qty: 0.8 }] },
  aura: { minutes: 15, usages: [{ supplyId: "pigmento", qty: 0.05 }, { supplyId: "consumibles", qty: 1 }] },
  aurora: { minutes: 10, usages: [{ supplyId: "pigmento", qty: 0.05 }] },
  strass: { minutes: 10, usages: [{ supplyId: "strass", qty: 10 }, { supplyId: "pegamento-apliques", qty: 0.3 }] },
  "strass-full": { minutes: 40, usages: [{ supplyId: "strass", qty: 60 }, { supplyId: "pegamento-apliques", qty: 1 }] },
  "strass-colores": { minutes: 12, usages: [{ supplyId: "gemas", qty: 10 }, { supplyId: "pegamento-apliques", qty: 0.3 }] },
  perlas: { minutes: 12, usages: [{ supplyId: "perlas", qty: 20 }, { supplyId: "pegamento-apliques", qty: 0.3 }] },
  cadenas: { minutes: 15, usages: [{ supplyId: "cadena", qty: 10 }, { supplyId: "pegamento-apliques", qty: 0.3 }] },
  "flor-3d": { minutes: 15, usages: [{ supplyId: "flor-organza", qty: 2 }, { supplyId: "strass", qty: 2 }, { supplyId: "pegamento-apliques", qty: 0.3 }] },
  "3d": { minutes: 30, usages: [{ supplyId: "base-rubber", qty: 0.5 }] },
  "animal-print": { minutes: 25, usages: [{ supplyId: "gel-art", qty: 0.3 }] },
  flores: { minutes: 30, usages: [{ supplyId: "gel-art", qty: 0.3 }] },
  puntitos: { minutes: 10, usages: [{ supplyId: "gel-art", qty: 0.1 }] },
  cebra: { minutes: 25, usages: [{ supplyId: "gel-art", qty: 0.3 }] },
  ondas: { minutes: 20, usages: [{ supplyId: "gel-art", qty: 0.3 }] },
  estrellas: { minutes: 10, usages: [{ supplyId: "gel-art", qty: 0.1 }] },
  tribal: { minutes: 35, usages: [{ supplyId: "gel-art", qty: 0.4 }] },
  blooming: { minutes: 20, usages: [{ supplyId: "blooming", qty: 0.5 }] },
  personajes: { minutes: 50, usages: [{ supplyId: "gel-art", qty: 0.5 }] },
  "a-mano": { minutes: 60, usages: [{ supplyId: "gel-art", qty: 0.5 }] },
  encapsulado: { minutes: 20, usages: [{ supplyId: "foil", qty: 5 }, { supplyId: "flores-secas", qty: 4 }, { supplyId: "base-rubber", qty: 0.5 }] },
};

/** Lo que agrega el largo: más gel, más limado. */
const LENGTH_EXTRA: Record<string, { minutes: number; usages: Usage[] }> = {
  largo: { minutes: 5, usages: [{ supplyId: "base-rubber", qty: 0.3 }] },
  xl: { minutes: 10, usages: [{ supplyId: "base-rubber", qty: 0.6 }] },
};

const MIN_SHARE = 0.4;
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function addUsages(into: Map<string, number>, usages: Usage[], factor = 1) {
  for (const u of usages) into.set(u.supplyId, round((into.get(u.supplyId) ?? 0) + u.qty * factor, 3));
}

/** Receta de una técnica del armador como ítem incremental (lo que suma sobre el set base, en las 10 uñas). */
export function techniqueRecipe(id: string, label: string): SeedRecipe | null {
  const t = TECHNIQUE_RECIPES[id];
  return t ? { target: `extra:${id}`, label: `Extra: ${label}`, minutes: t.minutes, usages: t.usages } : null;
}

/**
 * Receta completa de un set armado (base + largo + técnicas según en cuántas uñas van). Un segundo color de base en
 * las uñas acento suma esmalte y unos minutos de cambio de color.
 */
export function selectionRecipe(sel: BuilderSelection, target: string, label: string): SeedRecipe {
  const usages = new Map<string, number>();
  let minutes = BASE_RECIPE.minutes;
  addUsages(usages, BASE_RECIPE.usages);

  const len = LENGTH_EXTRA[sel.length];
  if (len) {
    minutes += len.minutes;
    addUsages(usages, len.usages);
  }

  const nails = allNails(sel);
  const perExtra = new Map<string, number>();
  const colors = new Set<string>();
  for (const n of nails) {
    colors.add(n.color);
    for (const id of new Set(n.extras)) perExtra.set(id, (perExtra.get(id) ?? 0) + 1);
  }
  for (const [id, count] of perExtra) {
    const t = TECHNIQUE_RECIPES[id];
    if (!t) continue;
    const share = Math.max(MIN_SHARE, count / NAIL_COUNT);
    minutes += Math.round(t.minutes * share);
    addUsages(usages, t.usages, share);
  }
  // dijes: la pieza (insumo) y un par de minutos para ubicarla y pegarla
  const charmQty = (sel.charms ?? []).reduce((a, c) => a + Math.max(0, c.qty), 0);
  if (charmQty > 0) {
    minutes += 2 * charmQty;
    addUsages(usages, [{ supplyId: "dije", qty: charmQty }, { supplyId: "pegamento-apliques", qty: 0.1 * charmQty }]);
  }

  const extraColors = colors.size - 1;
  if (extraColors > 0) {
    minutes += 5 * extraColors;
    addUsages(usages, [{ supplyId: "semi", qty: 0.3 * extraColors }]);
  }

  return { target, label, minutes, usages: [...usages].map(([supplyId, qty]) => ({ supplyId, qty })) };
}

export function recipeMaterials(recipe: Pick<SeedRecipe, "usages">, supplies: SeedSupply[] = SEED_SUPPLIES): number {
  const byId = new Map(supplies.map((s) => [s.id, s.packCost / s.packQty]));
  return recipe.usages.reduce((acc, u) => acc + (byId.get(u.supplyId) ?? 0) * u.qty, 0);
}

/**
 * Precio a partir del costo: insumos + tiempo a valor hora, más el margen objetivo (lo que queda después de pagarse
 * la hora), redondeado hacia arriba a $500.
 */
export function priceFromCost(materials: number, minutes: number, hourlyRate: number, targetMargin: number): number {
  const cost = materials + (minutes / 60) * hourlyRate;
  return Math.ceil(cost / (1 - targetMargin) / 500) * 500;
}
