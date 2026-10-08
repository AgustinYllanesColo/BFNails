"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteDesign, upsertDesign, uploadDesignImage } from "@/lib/admin/catalog";
import { slugify } from "@/lib/format";

const schema = z.object({
  originalSlug: z.string().optional(),
  slug: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(600).default(""),
  shape: z.enum(["almendra", "coffin", "cuadrada", "ovalada", "stiletto"]),
  length: z.enum(["corto", "medio", "largo", "xl"]),
  finish: z.enum(["glossy", "mate", "cromado"]),
  complexity: z.coerce.number().int().min(1).max(4),
  price: z.coerce.number().int().min(0).max(5_000_000),
  tags: z.string().default(""),
  colors: z.string().default(""),
  featured: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  sort: z.coerce.number().int().default(0),
  images: z.string().default(""), // URLs existentes, una por línea
});

export type DesignFormState = { error?: string } | undefined;

export async function saveDesign(_prev: DesignFormState, formData: FormData): Promise<DesignFormState> {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = schema.safeParse({ ...raw, featured: raw.featured === "on", active: raw.active === "on" });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ") };
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  const images = d.images.split("\n").map((s) => s.trim()).filter(Boolean);
  try {
    for (const f of formData.getAll("newImages")) {
      if (f instanceof File && f.size > 0) images.push(await uploadDesignImage(f, slug));
    }
    await upsertDesign(
      {
        slug,
        name: d.name,
        description: d.description,
        images,
        shape: d.shape,
        length: d.length,
        finish: d.finish,
        complexity: d.complexity as 1 | 2 | 3 | 4,
        price: d.price,
        tags: d.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        colors: d.colors.split(",").map((c) => c.trim()).filter(Boolean),
        featured: d.featured,
        active: d.active,
        sort: d.sort,
      },
      d.originalSlug || undefined,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/catalogo");
  revalidatePath("/");
  revalidatePath("/admin/catalogo");
  redirect(`/admin/catalogo/${slug}`);
}

export async function removeDesign(slug: string) {
  await requireAdmin();
  await deleteDesign(slug);
  revalidatePath("/catalogo");
  revalidatePath("/admin/catalogo");
  redirect("/admin/catalogo");
}
