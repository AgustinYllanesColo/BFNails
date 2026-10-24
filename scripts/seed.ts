/**
 * Seed inicial: catálogo, opciones del armador, insumos de ejemplo y configuración.
 * Uso: DATABASE_URL=... pnpm db:seed   (idempotente: upsert por clave)
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { SEED_DESIGNS } from "../lib/data/catalog";
import { DEFAULT_BUILDER_CONFIG } from "../lib/pricing";
import { DEFAULT_SHIPPING_TABLE } from "../lib/shipping/table";
import { PRESETS } from "../lib/data/presets";
import { BASE_RECIPE, SEED_SUPPLIES, selectionRecipe, techniqueRecipe } from "../lib/data/recipes";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

async function main() {
  // Catálogo
  for (const [i, d] of SEED_DESIGNS.entries()) {
    await db
      .insert(schema.designs)
      .values({
        slug: d.slug,
        name: d.name,
        description: d.description,
        images: d.images,
        shape: d.shape,
        length: d.length,
        finish: d.finish,
        complexity: d.complexity,
        price: d.price,
        tags: d.tags,
        colors: d.colors ?? [],
        featured: Boolean(d.featured),
        active: d.active ?? true,
        sort: i,
      })
      .onConflictDoUpdate({
        target: schema.designs.slug,
        set: { name: d.name, description: d.description, shape: d.shape, length: d.length, finish: d.finish, complexity: d.complexity, price: d.price, tags: d.tags, colors: d.colors ?? [], featured: Boolean(d.featured), sort: i, updatedAt: new Date() },
      });
  }

  // Opciones del armador
  const c = DEFAULT_BUILDER_CONFIG;
  type OptRow = { id: string; kind: string; label: string; delta: number; complexity: number; sort: number; group?: string; hex?: string; description?: string };
  const rows: OptRow[] = [
    ...c.shapes.map((o, i) => ({ id: o.id, kind: "shape", label: o.label, delta: o.delta, complexity: o.complexity ?? 0, sort: i })),
    ...c.lengths.map((o, i) => ({ id: o.id, kind: "length", label: o.label, delta: o.delta, complexity: o.complexity ?? 0, sort: i })),
    ...c.finishes.map((o, i) => ({ id: o.id, kind: "finish", label: o.label, delta: o.delta, complexity: o.complexity ?? 0, sort: i })),
    ...c.bases.map((o, i) => ({ id: o.id, kind: "base", label: o.label, delta: o.delta, complexity: 0, hex: o.hex, sort: i })),
    ...c.extras.map((o, i) => ({ id: o.id, kind: "extra", label: o.label, delta: o.delta, complexity: o.complexity ?? 0, group: o.group, description: o.description, sort: i })),
  ];
  for (const r of rows) {
    await db
      .insert(schema.builderOptions)
      .values(r)
      .onConflictDoUpdate({ target: schema.builderOptions.id, set: { label: r.label, delta: r.delta, complexity: r.complexity, group: r.group, hex: r.hex, sort: r.sort } });
  }

  // Configuración
  const settingsRows: Array<{ key: string; value: unknown }> = [
    { key: "basePrice", value: c.basePrice },
    { key: "hourlyRate", value: 6000 },
    { key: "targetMargin", value: 0.25 },
    { key: "shipping", value: DEFAULT_SHIPPING_TABLE },
  ];
  for (const s of settingsRows) {
    await db.insert(schema.settings).values({ key: s.key, value: s.value }).onConflictDoNothing();
  }

  // Insumos (precios de Bella Central) y recetas de costo. Los insumos se enlazan por nombre; una receta que Brenda ya
  // editó desde el admin no se pisa.
  const existing = await db.select({ id: schema.supplies.id, name: schema.supplies.name }).from(schema.supplies);
  const idByName = new Map(existing.map((e) => [e.name, e.id]));
  for (const sp of SEED_SUPPLIES) {
    if (idByName.has(sp.name)) continue;
    const [row] = await db
      .insert(schema.supplies)
      .values({ name: sp.name, unit: sp.unit, packCost: sp.packCost, packQty: String(sp.packQty), supplier: sp.supplier, notes: sp.notes })
      .returning({ id: schema.supplies.id });
    idByName.set(sp.name, row.id);
  }
  const uuidOf = new Map(SEED_SUPPLIES.map((sp) => [sp.id, idByName.get(sp.name)!]));
  const seedRecipes = [
    BASE_RECIPE,
    ...c.extras.map((e) => techniqueRecipe(e.id, e.label)).filter((r) => r !== null),
    ...SEED_DESIGNS.filter((d) => PRESETS[d.slug]).map((d) => selectionRecipe(PRESETS[d.slug], `design:${d.slug}`, `Diseño: ${d.name}`)),
  ];
  for (const r of seedRecipes) {
    await db
      .insert(schema.recipes)
      .values({ target: r.target, label: r.label, minutes: r.minutes, usages: r.usages.map((u) => ({ supplyId: uuidOf.get(u.supplyId)!, qty: u.qty })) })
      .onConflictDoNothing();
  }

  // Admin allowlist desde ADMIN_EMAILS
  for (const email of (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)) {
    await db.insert(schema.adminUsers).values({ email }).onConflictDoNothing();
  }

  console.log("Seed listo ✨");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.end());
