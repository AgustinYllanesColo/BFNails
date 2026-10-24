import "server-only";
import { eq } from "drizzle-orm";
import { requireDb } from "./db";
import { getDb } from "@/lib/db/client";
import { recipes, supplies } from "@/lib/db/schema";
import { SEED_DESIGNS } from "@/lib/data/catalog";
import { PRESETS } from "@/lib/data/presets";
import { BASE_RECIPE, SEED_SUPPLIES, selectionRecipe, techniqueRecipe } from "@/lib/data/recipes";
import { DEFAULT_BUILDER_CONFIG } from "@/lib/pricing";

export type Supply = {
  id: string;
  name: string;
  unit: string;
  packCost: number;
  packQty: number;
  unitCost: number;
  supplier?: string | null;
  url?: string | null;
  notes?: string | null;
  active: boolean;
};

export type Recipe = {
  id: string;
  target: string; // base | extra:<id> | design:<slug>
  label: string;
  minutes: number;
  usages: Array<{ supplyId: string; qty: number }>;
};

/** Sin base de datos, el admin muestra los insumos y recetas del seed (lib/data/recipes.ts), solo lectura. */
export function seedSupplies(): Supply[] {
  return SEED_SUPPLIES.map((s) => ({ id: s.id, name: s.name, unit: s.unit, packCost: s.packCost, packQty: s.packQty, unitCost: s.packCost / s.packQty, supplier: s.supplier ?? null, notes: s.notes ?? null, active: true }));
}

export function seedRecipes(): Recipe[] {
  const list = [
    BASE_RECIPE,
    ...DEFAULT_BUILDER_CONFIG.extras.map((e) => techniqueRecipe(e.id, e.label)).filter((r) => r !== null),
    ...SEED_DESIGNS.filter((d) => PRESETS[d.slug]).map((d) => selectionRecipe(PRESETS[d.slug], `design:${d.slug}`, `Diseño: ${d.name}`)),
  ];
  return list.map((r) => ({ id: r.target, ...r }));
}

export async function listSupplies(): Promise<Supply[]> {
  const db = getDb();
  if (!db) return seedSupplies();
  const rows = await db.select().from(supplies).orderBy(supplies.name);
  return rows.map((r) => {
    const packQty = Number(r.packQty);
    return { ...r, packQty, unitCost: packQty > 0 ? r.packCost / packQty : 0 };
  });
}

export async function upsertSupply(input: { id?: string; name: string; unit: string; packCost: number; packQty: number; supplier?: string; url?: string; notes?: string; active?: boolean }) {
  const db = requireDb();
  const values = { name: input.name, unit: input.unit, packCost: input.packCost, packQty: String(input.packQty), supplier: input.supplier, url: input.url, notes: input.notes, active: input.active ?? true, updatedAt: new Date() };
  if (input.id) await db.update(supplies).set(values).where(eq(supplies.id, input.id));
  else await db.insert(supplies).values(values);
}

export async function deleteSupply(id: string) {
  await requireDb().delete(supplies).where(eq(supplies.id, id));
}

export async function listRecipes(): Promise<Recipe[]> {
  const db = getDb();
  if (!db) return seedRecipes();
  return db.select().from(recipes).orderBy(recipes.target);
}

export async function upsertRecipe(input: Omit<Recipe, "id">) {
  const db = requireDb();
  await db
    .insert(recipes)
    .values({ ...input, updatedAt: new Date() })
    .onConflictDoUpdate({ target: recipes.target, set: { label: input.label, minutes: input.minutes, usages: input.usages, updatedAt: new Date() } });
}

export async function deleteRecipe(target: string) {
  await requireDb().delete(recipes).where(eq(recipes.target, target));
}

/** Costo de una receta: insumos + tiempo a valor hora. */
export function recipeCost(recipe: Recipe, suppliesById: Map<string, Supply>, hourlyRate: number) {
  const materials = recipe.usages.reduce((acc, u) => acc + (suppliesById.get(u.supplyId)?.unitCost ?? 0) * u.qty, 0);
  const labor = (recipe.minutes / 60) * hourlyRate;
  return { materials, labor, total: materials + labor };
}
