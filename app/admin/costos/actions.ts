"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteRecipe, upsertRecipe } from "@/lib/admin/costs";

export async function saveRecipe(formData: FormData) {
  await requireAdmin();
  const target = z.string().trim().min(1).max(80).parse(formData.get("target"));
  const label = z.string().trim().min(1).max(120).parse(formData.get("label"));
  const minutes = z.coerce.number().int().min(0).max(600).parse(formData.get("minutes") ?? 0);
  const supplyIds = formData.getAll("supplyId").map(String);
  const usages = supplyIds
    .map((supplyId) => ({ supplyId, qty: Number(formData.get(`qty:${supplyId}`) ?? 0) }))
    .filter((u) => u.qty > 0);
  await upsertRecipe({ target, label, minutes, usages });
  revalidatePath("/admin/costos");
}

export async function removeRecipe(target: string) {
  await requireAdmin();
  await deleteRecipe(target);
  revalidatePath("/admin/costos");
}
