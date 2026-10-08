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
    { key: "targetMargin", value: 0.55 },
    { key: "shipping", value: DEFAULT_SHIPPING_TABLE },
  ];
  for (const s of settingsRows) {
    await db.insert(schema.settings).values({ key: s.key, value: s.value }).onConflictDoNothing();
  }

  // Insumos de ejemplo (a reemplazar con los reales)
  const supplies = [
    { name: "Tips soft gel (bolsa 500 u)", unit: "u", packCost: 9000, packQty: "500" },
    { name: "Base rubber / gel constructor 15 ml", unit: "ml", packCost: 7500, packQty: "15" },
    { name: "Esmalte semipermanente 10 ml", unit: "ml", packCost: 4500, packQty: "10" },
    { name: "Top coat 15 ml", unit: "ml", packCost: 6000, packQty: "15" },
    { name: "Pegamento para press-on 3 g", unit: "u", packCost: 1200, packQty: "1" },
    { name: "Lima descartable", unit: "u", packCost: 2500, packQty: "25" },
    { name: "Strass (pack 100 u)", unit: "u", packCost: 3500, packQty: "100" },
    { name: "Caja / packaging", unit: "u", packCost: 8000, packQty: "20" },
  ];
  const existing = await db.select({ name: schema.supplies.name }).from(schema.supplies);
  const names = new Set(existing.map((e) => e.name));
  for (const s of supplies) if (!names.has(s.name)) await db.insert(schema.supplies).values(s);

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
