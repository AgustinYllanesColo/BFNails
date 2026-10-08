/**
 * Genera el SQL del seed (idempotente) para aplicarlo sin DATABASE_URL,
 * por ejemplo desde el SQL editor de Supabase. Uso: pnpm tsx scripts/seed-sql.ts > seed.sql
 */
import { SEED_DESIGNS } from "../lib/data/catalog";
import { DEFAULT_BUILDER_CONFIG } from "../lib/pricing";
import { DEFAULT_SHIPPING_TABLE } from "../lib/shipping/table";

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
for (const [key, value] of [["basePrice", c.basePrice], ["hourlyRate", 6000], ["targetMargin", 0.55], ["shipping", DEFAULT_SHIPPING_TABLE]] as const) {
  out.push(`INSERT INTO bfnails.settings (key,value) VALUES (${q(key)}, ${typeof value === "number" ? `'${value}'::jsonb` : q(value)}) ON CONFLICT (key) DO NOTHING;`);
}
const supplies = [
  ["Tips soft gel (bolsa 500 u)", "u", 9000, 500],
  ["Base rubber / gel constructor 15 ml", "ml", 7500, 15],
  ["Esmalte semipermanente 10 ml", "ml", 4500, 10],
  ["Top coat 15 ml", "ml", 6000, 15],
  ["Pegamento para press-on 3 g", "u", 1200, 1],
  ["Lima descartable", "u", 2500, 25],
  ["Strass (pack 100 u)", "u", 3500, 100],
  ["Caja / packaging", "u", 8000, 20],
] as const;
for (const [name, unit, packCost, packQty] of supplies) {
  out.push(`INSERT INTO bfnails.supplies (name,unit,pack_cost,pack_qty) SELECT ${q(name)},${q(unit)},${packCost},${packQty} WHERE NOT EXISTS (SELECT 1 FROM bfnails.supplies WHERE name=${q(name)});`);
}
process.stdout.write(out.join("\n") + "\n");
