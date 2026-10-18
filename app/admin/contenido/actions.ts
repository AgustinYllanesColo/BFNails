"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { uploadDesignImage } from "@/lib/admin/catalog";
import { getAllCharms, getAllPromos, getKit, writeContent } from "@/lib/data/content-repo";
import type { Charm, Promo } from "@/lib/data/content";
import { slugify } from "@/lib/format";

function refresh() {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/dijes");
  revalidatePath("/disena");
  revalidatePath("/admin/contenido");
}

const optNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(0).optional());
const optStr = (max: number) => z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().trim().max(max).optional());

async function imageFrom(formData: FormData, folder: string, current?: string): Promise<string | undefined> {
  if (formData.get("removeImage") === "on") return undefined;
  const f = formData.get("image");
  if (f instanceof File && f.size > 0) return uploadDesignImage(f, folder);
  return current;
}

/* ---------- Promos ---------- */

const promoSchema = z.object({
  id: optStr(80),
  badge: z.string().trim().min(1).max(20),
  title: z.string().trim().min(2).max(80),
  text: optStr(160),
  price: optNum,
  priceBefore: optNum,
  href: optStr(300),
  until: optStr(10),
  theme: z.enum(["rojo", "bordo", "rosa", "leopardo"]),
});

export async function savePromo(formData: FormData) {
  await requireAdmin();
  const d = promoSchema.parse(Object.fromEntries(formData.entries()));
  const all = await getAllPromos();
  const prev = all.find((p) => p.id === d.id);
  const id = prev?.id ?? `${slugify(d.title)}-${Date.now().toString(36)}`;
  const promo: Promo = {
    ...d,
    id,
    image: await imageFrom(formData, "promos", prev?.image),
    active: formData.get("active") === "on",
  };
  await writeContent("promos", prev ? all.map((p) => (p.id === id ? promo : p)) : [promo, ...all]);
  refresh();
}

export async function deletePromo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await writeContent("promos", (await getAllPromos()).filter((p) => p.id !== id));
  refresh();
}

/* ---------- Dijes ---------- */

const charmSchema = z.object({
  id: optStr(80),
  name: z.string().trim().min(2).max(60),
  price: z.coerce.number().int().min(0).max(1_000_000),
  hex: optStr(9),
});

export async function saveCharm(formData: FormData) {
  await requireAdmin();
  const d = charmSchema.parse(Object.fromEntries(formData.entries()));
  const all = await getAllCharms();
  const prev = all.find((c) => c.id === d.id);
  const id = prev?.id ?? `${slugify(d.name)}-${Date.now().toString(36)}`;
  const charm: Charm = {
    ...d,
    id,
    image: await imageFrom(formData, "dijes", prev?.image),
    active: formData.get("active") === "on",
  };
  await writeContent("charms", prev ? all.map((c) => (c.id === id ? charm : c)) : [...all, charm]);
  refresh();
}

export async function deleteCharm(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await writeContent("charms", (await getAllCharms()).filter((c) => c.id !== id));
  refresh();
}

/* ---------- Kit ---------- */

export async function saveKit(formData: FormData) {
  await requireAdmin();
  const prev = await getKit();
  const items = String(formData.get("items") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((l) => {
      const [name, detail] = l.split("|").map((x) => x.trim());
      return detail ? { name, detail } : { name };
    });
  const remove = formData.getAll("removeImages").map(String);
  const images = prev.images.filter((src) => !remove.includes(src));
  for (const f of formData.getAll("newImages")) {
    if (f instanceof File && f.size > 0) images.push(await uploadDesignImage(f, "kit"));
  }
  await writeContent("kit", { items, images });
  refresh();
}
