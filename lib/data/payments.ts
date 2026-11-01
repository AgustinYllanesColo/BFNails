import "server-only";
import type { Order } from "@/lib/types";
import { getPayment } from "@/lib/mercadopago";
import { getOrderByNumber, markOrderPaid, updateOrder } from "./orders";
import { sendWhatsapp, whatsappNotifyEnabled } from "@/lib/whatsapp-notify";
import { siteConfig } from "@/lib/site";
import { formatARS } from "@/lib/format";

const SHIPPED_OR_PAID = ["pagado", "en_produccion", "listo", "enviado", "entregado"];

export type ReconcileResult = { order?: Order; justPaid?: Order; ignored?: string };

function addNote(order: Order, note: string) {
  return updateOrder(order.id, { notes: [order.notes, note].filter(Boolean).join("\n") });
}

async function alertBrenda(order: Order, text: string) {
  if (!whatsappNotifyEnabled()) return;
  await sendWhatsapp(`⚠️ *PEDIDO ${order.number}*\n${text}\n🔗 ${siteConfig.url}/admin/pedidos/${order.id}`).catch((e) => console.error("[pago] aviso falló", e));
}

/**
 * Trae el pago de Mercado Pago y deja el pedido como corresponde. Lo usan el webhook y la página del pedido cuando la
 * clienta vuelve de pagar (por si el webhook tarda o no llega). Es idempotente: llamarlo dos veces no paga ni avisa dos
 * veces. `justPaid` viene solo la vez que el pedido pasó a pagado, para mandar el aviso una sola vez.
 */
export async function reconcilePayment(paymentId: string): Promise<ReconcileResult> {
  let payment: Awaited<ReturnType<typeof getPayment>>;
  try {
    payment = await getPayment(paymentId);
  } catch (err) {
    // un pago que no existe (notificación de prueba, otra app) no se reintenta: MP insistiría para siempre
    if ((err as { status?: number }).status === 404) return { ignored: "pago no encontrado" };
    throw err;
  }
  const number = payment.external_reference;
  if (!number) return { ignored: "sin external_reference" };
  const order = await getOrderByNumber(number);
  if (!order) return { ignored: "orden no encontrada" };
  const id = String(payment.id);

  if (payment.status === "approved") {
    if (SHIPPED_OR_PAID.includes(order.status)) return { order };
    // tiene que haber pagado lo que dice el pedido (una preferencia vieja con otro total no lo da por pagado)
    const amount = Number(payment.transaction_amount ?? 0);
    if (payment.currency_id !== "ARS" || amount + 1 < order.total) {
      const note = `⚠️ Mercado Pago acreditó ${formatARS(amount)} ${payment.currency_id ?? ""} (pago ${id}) pero el pedido es de ${formatARS(order.total)}. No se marcó como pagado: revisalo.`;
      if (!order.notes?.includes(`pago ${id}`)) {
        await addNote(order, note);
        await alertBrenda(order, note);
      }
      return { order };
    }
    const paid = await markOrderPaid(order.id, id);
    return paid ? { order: paid, justPaid: paid } : { order };
  }

  // devolución o contracargo de un pedido ya pago: Brenda no tiene que mandarlo sin cobrar
  if ((payment.status === "refunded" || payment.status === "charged_back") && SHIPPED_OR_PAID.includes(order.status)) {
    const note = `⚠️ Mercado Pago: el pago ${id} quedó "${payment.status === "refunded" ? "devuelto" : "contracargo"}". Se canceló el pedido.`;
    const updated = await updateOrder(order.id, { status: "cancelado", notes: [order.notes, note].filter(Boolean).join("\n") });
    await alertBrenda(order, note);
    return { order: updated ?? order };
  }

  if (!order.payment.mpPaymentId) {
    const updated = await updateOrder(order.id, { payment: { ...order.payment, mpPaymentId: id } });
    return { order: updated ?? order };
  }
  return { order };
}
