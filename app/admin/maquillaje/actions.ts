"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { uploadDesignImage } from "@/lib/admin/catalog";
import { getAllMakeup, writeContent } from "@/lib/data/content-repo";
import { resetMakeupSold } from "@/lib/data/makeup-stock";
import { makeupForSave, type MakeupProduct } from "@/lib/data/makeup";
import { parseComboIncludes, parseMakeupForm } from "@/lib/admin/makeup-form";
import { slugify } from "@/lib/format";

function refresh() {
  revalidatePath("/");
  revalidatePath("/maquillaje");
  revalidatePath("/admin/maquillaje", "layout");
}

async function imageFrom(formData: FormData, current?: string): Promise<string | undefined> {
  if (formData.get("removeImage") === "on") return undefined;
  const f = formData.get("image");
  if (f instanceof File && f.size > 0) return uploadDesignImage(f, "maquillaje");
  return current;
}

/**
 * Cuadro fijo sacado del video en el navegador (ya subido a Blob): se usa como foto solo si el producto no tiene una.
 * Se acepta únicamente una dirección del Blob de la tienda.
 */
function posterFrom(formData: FormData): string | undefined {
  const v = String(formData.get("videoPoster") ?? "");
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com") ? v : undefined;
  } catch {
    return undefined;
  }
}

export async function saveMakeup(formData: FormData) {
  await requireAdmin();
  const parsed = parseMakeupForm(formData);
  if (!parsed.success) throw new Error("Revisá los datos del producto: " + parsed.error.issues.map((i) => i.path.join(".")).join(", "));
  const d = parsed.data;
  const all = await getAllMakeup();
  const prev = all.find((m) => m.id === d.id);
  const id = prev?.id ?? `${slugify(d.name)}-${Date.now().toString(36)}`;
  const isCombo = d.category === "combos";
  const product: MakeupProduct = {
    ...d,
    id,
    // forma y color solo sirven para el dibujo provisorio (van fotos): no se piden, se conservan
    form: isCombo ? "combo" : prev?.form && prev.form !== "combo" ? prev.form : "labial",
    hex: prev?.hex,
    // el código del proveedor lo carga Claude desde los tickets (lib/data/makeup.ts): se conserva
    code: prev?.code,
    // combo: qué trae se elige en el formulario y no tiene stock propio (ver CLAUDE.md)
    includes: isCombo ? parseComboIncludes(formData, all) : undefined,
    stock: isCombo ? undefined : d.stock,
    // el video llega ya subido (el navegador lo achica y lo sube a Blob): acá viaja solo su dirección; vacío = sin video
    video: d.video,
    image: (await imageFrom(formData, prev?.image)) ?? posterFrom(formData),
    featured: formData.get("featured") === "on",
    isNew: formData.get("isNew") === "on",
    active: formData.get("active") === "on",
  };
  // se guarda el stock real (cargado − vendido), así que lo vendido vuelve a cero
  await writeContent("makeup", makeupForSave(prev ? all.map((m) => (m.id === id ? product : m)) : [product, ...all]));
  await resetMakeupSold();
  refresh();
  redirect(`/admin/maquillaje/${encodeURIComponent(id)}?guardado=1`);
}

export async function deleteMakeup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await writeContent("makeup", makeupForSave((await getAllMakeup()).filter((m) => m.id !== id)));
    await resetMakeupSold();
    refresh();
  }
  redirect("/admin/maquillaje");
}
