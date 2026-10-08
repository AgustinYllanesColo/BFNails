"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteSupply, upsertSupply } from "@/lib/admin/costs";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  unit: z.string().trim().min(1).max(10),
  packCost: z.coerce.number().int().min(0),
  packQty: z.coerce.number().positive(),
  supplier: z.string().trim().max(120).optional(),
  url: z.string().trim().max(400).optional(),
  notes: z.string().trim().max(400).optional(),
});

export async function saveSupply(formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const d = schema.parse({ ...raw, id: raw.id || undefined });
  await upsertSupply(d);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/costos");
}

export async function removeSupply(id: string) {
  await requireAdmin();
  await deleteSupply(id);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/costos");
}
