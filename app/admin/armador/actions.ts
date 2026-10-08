"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { setBasePrice, updateOption } from "@/lib/admin/options";

export async function saveOptions(formData: FormData) {
  await requireAdmin();
  const base = z.coerce.number().int().min(0).parse(formData.get("basePrice"));
  await setBasePrice(base);
  const ids = formData.getAll("id").map(String);
  for (const id of ids) {
    const delta = z.coerce.number().int().parse(formData.get(`delta:${id}`) ?? 0);
    const complexity = z.coerce.number().int().min(0).max(10).parse(formData.get(`complexity:${id}`) ?? 0);
    const active = formData.get(`active:${id}`) === "on";
    await updateOption(id, { delta, complexity, active });
  }
  revalidatePath("/disena");
  revalidatePath("/admin/armador");
}
