import "server-only";
import type { Design } from "@/lib/types";
import { SEED_DESIGNS } from "./catalog";
import { getDb } from "@/lib/db/client";
import { designs as designsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Repositorio de catálogo. Con DATABASE_URL lee de Postgres; sin DB usa el seed.
 * Así el sitio corre en local y en preview sin infraestructura.
 */

function rowToDesign(r: typeof designsTable.$inferSelect): Design {
  return {
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    images: r.images ?? [],
    shape: r.shape as Design["shape"],
    length: r.length as Design["length"],
    finish: r.finish as Design["finish"],
    complexity: r.complexity as Design["complexity"],
    price: r.price,
    tags: r.tags ?? [],
    featured: r.featured,
    active: r.active,
    colors: r.colors ?? [],
  };
}

export async function getDesigns(): Promise<Design[]> {
  const db = getDb();
  if (!db) return SEED_DESIGNS.filter((d) => d.active !== false);
  const rows = await db.select().from(designsTable).where(eq(designsTable.active, true)).orderBy(designsTable.sort);
  return rows.map(rowToDesign);
}

export async function getFeaturedDesigns(limit = 4): Promise<Design[]> {
  const all = await getDesigns();
  const featured = all.filter((d) => d.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getDesign(slug: string): Promise<Design | null> {
  const db = getDb();
  if (!db) return SEED_DESIGNS.find((d) => d.slug === slug) ?? null;
  const [row] = await db.select().from(designsTable).where(eq(designsTable.slug, slug)).limit(1);
  return row ? rowToDesign(row) : null;
}
