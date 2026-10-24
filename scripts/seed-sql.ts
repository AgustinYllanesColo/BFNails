/**
 * Genera el SQL del seed (idempotente) para aplicarlo sin DATABASE_URL,
 * por ejemplo desde el SQL editor de Supabase. Uso: pnpm tsx scripts/seed-sql.ts > seed.sql
 */
import { SEED_DESIGNS } from "../lib/data/catalog";
import { DEFAULT_BUILDER_CONFIG } from "../lib/pricing";
import { DEFAULT_SHIPPING_TABLE } from "../lib/shipping/table";
import { PRESETS } from "../lib/data/presets";
import { BASE_RECIPE, SEED_SUPPLIES, selectionRecipe, techniqueRecipe } from "../lib/data/recipes";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `ARRAY[${v.map(q).join(",")}]::text[]`;
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const out: string[] = [];
SEED_DESIGNS.forEach((d, i) => {
  out.push(
    `INSERT INTO bfnails.designs (slug,name,description,images,shape,length,finish,complexity,price,tags,colors,featured,active,sort) VALUES (${[
      d.slug, d.name, d.description, d.images.length ? d.images : [], d.shape, d.length, d.finish, d.complexity, d.price, d.tags, d.colors ?? [], Boolean(d.featured), d.active ?? true, i,
    ].map(q).join(",")}) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, shape=EXCLUDED.shape, length=EXCLUDED.length, finish=EXCLUDED.finish, complexity=EXCLUDED.complexity, price=EXCLUDED.price, tags=EXCLUDED.tags, colors=EXCLUDED.colors, featured=EXCLUDED.featured, sort=EXCLUDED.sort, updated_at=now();`,
  );
});
const c = DEFAULT_BUILDER_CONFIG;
type Row = { id: string; kind: string; label: string; delta: number; complexity?: number; group?: string; hex?: string; description?: string };
const rows: Row[] = [
  ...c.shapes.map((o) => ({ ...o, kind: "shape" })),
  ...c.lengths.map((o) => ({ ...o, kind: "length" })),
  ...c.finishes.map((o) => ({ ...o, kind: "finish" })),
  ...c.bases.map((o) => ({ ...o, kind: "base" })),
  ...c.extras.map((o) => ({ ...o, kind: "extra" })),
];
rows.forEach((r, i) => {
  out.push(
    `INSERT INTO bfnails.builder_options (id,kind,"group",label,description,hex,delta,complexity,active,sort) VALUES (${[r.id, r.kind, r.group ?? null, r.label, r.description ?? null, r.hex ?? null, r.delta, r.complexity ?? 0, true, i].map(q).join(",")}) ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label, delta=EXCLUDED.delta, complexity=EXCLUDED.complexity, "group"=EXCLUDED."group", hex=EXCLUDED.hex, sort=EXCLUDED.sort;`,
  );
});
for (const [key, value] of [["basePrice", c.basePrice], ["hourlyRate", 6000], ["targetMargin", 0.25], ["shipping", DEFAULT_SHIPPING_TABLE]] as const) {
  out.push(`INSERT INTO bfnails.settings (key,value) VALUES (${q(key)}, ${typeof value === "number" ? `'${value}'::jsonb` : q(value)}) ON CONFLICT (key) DO NOTHING;`);
}
for (const sp of SEED_SUPPLIES) {
  out.push(
    `INSERT INTO bfnails.supplies (name,unit,pack_cost,pack_qty,supplier,notes) SELECT ${q(sp.name)},${q(sp.unit)},${sp.packCost},${sp.packQty},${q(sp.supplier ?? null)},${q(sp.notes ?? null)} WHERE NOT EXISTS (SELECT 1 FROM bfnails.supplies WHERE name=${q(sp.name)});`,
  );
}
// Recetas: los insumos se enlazan por nombre (en la base tienen uuid). No pisa una receta ya editada.
const nameOf = new Map(SEED_SUPPLIES.map((sp) => [sp.id, sp.name]));
const seedRecipes = [
  BASE_RECIPE,
  ...c.extras.map((e) => techniqueRecipe(e.id, e.label)).filter((r) => r !== null),
  ...SEED_DESIGNS.filter((d) => PRESETS[d.slug]).map((d) => selectionRecipe(PRESETS[d.slug], `design:${d.slug}`, `Diseño: ${d.name}`)),
];
for (const r of seedRecipes) {
  const usages = r.usages
    .map((u) => `jsonb_build_object('supplyId', (SELECT id::text FROM bfnails.supplies WHERE name=${q(nameOf.get(u.supplyId))} LIMIT 1), 'qty', ${u.qty})`)
    .join(",");
  out.push(`INSERT INTO bfnails.recipes (target,label,minutes,usages) SELECT ${q(r.target)},${q(r.label)},${r.minutes},jsonb_build_array(${usages}) ON CONFLICT (target) DO NOTHING;`);
}
process.stdout.write(out.join("\n") + "\n");
