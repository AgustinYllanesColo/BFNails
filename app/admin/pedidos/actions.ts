"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getOrderById, publicOrderUrl, updateOrder } from "@/lib/data/orders";
import { createPreference, mpEnabled } from "@/lib/mercadopago";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["a_confirmar", "pendiente_pago", "pagado", "en_produccion", "listo", "enviado", "entregado", "cancelado"];

export async function setOrderStatus(id: string, status: OrderStatus) {
  await requireAdmin();
  if (!STATUSES.includes(status)) throw new Error("Estado inválido");
  await updateOrder(id, { status });
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
}

export async function setTracking(id: string, formData: FormData) {
  await requireAdmin();
  const tracking = z.string().trim().max(60).parse(formData.get("tracking") ?? "");
  await updateOrder(id, { tracking: tracking || undefined });
  revalidatePath(`/admin/pedidos/${id}`);
}

export async function setNotes(id: string, formData: FormData) {
  await requireAdmin();
  const notes = z.string().trim().max(1000).parse(formData.get("notes") ?? "");
  await updateOrder(id, { notes: notes || undefined });
  revalidatePath(`/admin/pedidos/${id}`);
}

/**
 * Confirma el precio final de un pedido "a confirmar": fija el total, lo pasa a
 * pendiente de pago y, si corresponde, crea la preferencia de Mercado Pago.
 */
export async function confirmPrice(id: string, formData: FormData) {
  await requireAdmin();
  const total = z.coerce.number().int().min(0).max(5_000_000).parse(formData.get("total"));
  const order = await getOrderById(id);
  if (!order) throw new Error("Pedido no encontrado");
  const items = order.items.map((i) =>
    i.kind === "custom" ? { ...i, quote: { ...i.quote, needsConfirmation: false } } : i,
  );
  const subtotal = total - order.delivery.cost;
  let updated = await updateOrder(id, { total, subtotal, items, needsConfirmation: false, status: "pendiente_pago" });
  if (updated && updated.payment.method === "mercadopago" && mpEnabled()) {
    try {
      // Reparte el subtotal confirmado en un único ítem para MP.
      const forMp = { ...updated, items: [{ ...updated.items[0], kind: "design" as const, designSlug: "custom", name: `Pedido ${updated.number}`, unitPrice: subtotal, qty: 1, image: undefined }] };
      const pref = await createPreference(forMp, publicOrderUrl(updated));
      updated = await updateOrder(id, { payment: { ...updated.payment, mpPreferenceId: pref.id, mpInitPoint: pref.initPoint } });
    } catch (e) {
      console.error("[confirmPrice] MP", e);
    }
  }
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
}
