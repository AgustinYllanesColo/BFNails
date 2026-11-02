"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { uploadDesignImage } from "@/lib/admin/catalog";
import { getAllCharms, getAllPromos, getKit, writeContent } from "@/lib/data/content-repo";
import { CHARM_CATEGORIES, type Charm, type Promo } from "@/lib/data/content";

const CHARM_CATEGORY_IDS = CHARM_CATEGORIES.map((c) => c.id) as [Charm["category"] & string, ...(Charm["category"] & string)[]];
import { slugify } from "@/lib/format";
import { applyQuickEdits, parseQuickEdits } from "@/lib/admin/quick-edit";

function refresh() {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/dijes");
  revalidatePath("/disena");
  revalidatePath("/maquillaje");
  revalidatePath("/admin", "layout");
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
  text: optStr(400),
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
  category: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.enum(CHARM_CATEGORY_IDS).optional()),
});

export async function saveCharm(formData: FormData) {
  await requireAdmin();
  const d = charmSchema.parse(Object.fromEntries(formData.entries()));
  const all = await getAllCharms();
  const prev = all.find((c) => c.id === d.id);
  const id = prev?.id ?? `${slugify(d.name)}-${Date.now().toString(36)}`;
  const charm: Charm = {
    ...prev,
    ...d,
    id,
    // el color era para el dibujo provisorio: no se pide, se conserva
    hex: prev?.hex,
    category: d.category ?? prev?.category,
    image: await imageFrom(formData, "dijes", prev?.image),
    active: formData.get("active") === "on",
  };
  await writeContent("charms", prev ? all.map((c) => (c.id === id ? charm : c)) : [...all, charm]);
  refresh();
  redirect(`/admin/dijes/${encodeURIComponent(id)}?guardado=1`);
}

/** Carga rápida desde la lista de dijes: precio y visible de muchos a la vez. */
export async function saveCharmsQuick(formData: FormData) {
  await requireAdmin();
  const all = await getAllCharms();
  // los dijes no tienen "precio antes": el campo no se muestra y queda vacío
  await writeContent("charms", applyQuickEdits(all, parseQuickEdits(formData), {}));
  refresh();
}

export async function deleteCharm(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await writeContent("charms", (await getAllCharms()).filter((c) => c.id !== id));
  refresh();
  redirect("/admin/dijes");
}

/* ---------- Kit ---------- */

export async function saveKit(formData: FormData) {
  await requireAdmin();
  const prev = await getKit();
  // un renglón por cosa que trae el kit: nombre y, si hace falta, un detalle; los renglones vacíos no cuentan
  const names = formData.getAll("itemName").map((v) => String(v).trim());
  const details = formData.getAll("itemDetail").map((v) => String(v).trim());
  const items = names
    .map((name, i) => ({ name: name.slice(0, 80), detail: details[i]?.slice(0, 120) || undefined }))
    .filter((it) => it.name)
    .slice(0, 20)
    .map((it) => (it.detail ? it : { name: it.name }));
  const remove = formData.getAll("removeImages").map(String);
  const images = prev.images.filter((src) => !remove.includes(src));
  for (const f of formData.getAll("newImages")) {
    if (f instanceof File && f.size > 0) images.push(await uploadDesignImage(f, "kit"));
  }
  await writeContent("kit", { items, images });
  refresh();
}
