import "server-only";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { requireDb } from "./db";
import { designs } from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import type { Design } from "@/lib/types";

export type DesignInput = Omit<Design, "images"> & { images: string[]; sort?: number };

export async function upsertDesign(input: DesignInput, originalSlug?: string) {
  const db = requireDb();
  const slug = slugify(input.slug || input.name);
  const values = {
    slug,
    name: input.name,
    description: input.description,
    images: input.images,
    shape: input.shape,
    length: input.length,
    finish: input.finish,
    complexity: input.complexity,
    price: input.price,
    priceBefore: input.priceBefore ?? null,
    tags: input.tags,
    colors: input.colors ?? [],
    featured: Boolean(input.featured),
    active: input.active ?? true,
    sort: input.sort ?? 0,
    updatedAt: new Date(),
  };
  if (originalSlug) {
    await db.update(designs).set(values).where(eq(designs.slug, originalSlug));
  } else {
    await db.insert(designs).values(values);
  }
  return slug;
}

export async function deleteDesign(slug: string) {
  const db = requireDb();
  await db.delete(designs).where(eq(designs.slug, slug));
}

export async function listAllDesigns() {
  const db = requireDb();
  return db.select().from(designs).orderBy(designs.sort, designs.name);
}

/** Sube una imagen a Vercel Blob (o al bucket público `designs` de Supabase si no hay Blob) y devuelve la URL pública. */
export async function uploadDesignImage(file: File, slug: string): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(path, file, { access: "public", contentType: file.type || "image/jpeg", cacheControlMaxAge: 60 * 60 * 24 * 365 });
    return blob.url;
  }
  const BUCKET = "designs";
  const sb = supabaseAdmin();
  const buf = Buffer.from(await file.arrayBuffer());
  // Crea el bucket si no existe (idempotente)
  await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 8 * 1024 * 1024 }).catch(() => {});
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
