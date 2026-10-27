import "server-only";
import type { Order } from "@/lib/types";
import { PAYMENT_LABEL } from "@/lib/types";
import { formatARS } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { mailEnabled, notifyEmails, sendMail } from "@/lib/mail";
import { adminCreatedMail, adminPaidMail, customerCreatedMail, customerPaidMail } from "@/lib/mail-templates";
import { sendWhatsapp, whatsappNotifyEnabled } from "@/lib/whatsapp-notify";
import { publicOrderUrl } from "./orders";

/**
 * Avisos por mail de cada pedido: a la clienta (con su número de pedido y el link para seguirlo) y a Brenda
 * (ORDER_NOTIFY_EMAILS). Nunca rompen el pedido: si el mail falla queda en el log y el pedido sigue.
 */

async function safely(label: string, fn: () => Promise<unknown>, enabled = mailEnabled()) {
  if (!enabled) return;
  try {
    await fn();
  } catch (err) {
    console.error(`[aviso] ${label} falló`, err);
  }
}

/** Cómo está el pago al momento de crear el pedido, para que el aviso no parezca una venta cobrada. */
function paymentState(order: Order): string {
  if (order.status === "a_confirmar") return "A confirmar: revisá el pedido y pasale el precio final (todavía no pagó)";
  if (order.payment.method === "mercadopago") return "Va a pagar por Mercado Pago. Te aviso cuando se acredite";
  if (order.payment.method === "transferencia") return "Va a pagar por transferencia. Cuando te mande el comprobante, marcalo como pagado en el panel";
  return "Paga en efectivo cuando lo reciba";
}

/** "11 2636-1427" a partir del 549... guardado. */
function prettyPhone(wa: string): string {
  const d = wa.replace(/\D/g, "").replace(/^549/, "");
  return d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}` : d;
}

/** Una línea por ítem para el WhatsApp de Brenda. */
function itemLines(order: Order): string {
  return order.items
    .map((i) => {
      const name = i.kind === "custom" ? "Set a medida" : i.kind === "charm" ? `Dije ${i.name}` : i.name;
      const size = i.kind !== "charm" && i.sizes.mode === "standard" ? ` · talle ${i.sizes.size}` : i.kind !== "charm" && i.sizes.mode === "custom" ? " · medida personalizada" : "";
      return `💅 ${i.qty}× ${name}${size}`;
    })
    .join("\n");
}

/** Ficha del pedido para WhatsApp: una línea por dato, fácil de leer de un vistazo. */
function waCard(order: Order): string {
  return [
    `👤 ${order.customer.name} · ${prettyPhone(order.customer.whatsapp)}`,
    itemLines(order),
    `📦 ${order.delivery.label}`,
    `💰 Total ${formatARS(order.total)}`,
  ].join("\n");
}

/** Pedido creado: número de pedido a la clienta y aviso a Brenda. */
export async function notifyOrderCreated(order: Order) {
  const url = publicOrderUrl(order);
  const adminUrl = `${siteConfig.url}/admin/pedidos/${order.id}`;
  await safely("pedido creado (clienta)", () => sendMail({ to: order.customer.email ?? "", ...customerCreatedMail(order, url) }));
  await safely(
    "pedido creado (WhatsApp)",
    () =>
      sendWhatsapp(
        [
          `🛒 *NUEVO PEDIDO ${order.number}* · todavía NO está pago`,
          "",
          waCard(order),
          "",
          `⏳ ${paymentState(order)}.`,
          `🔗 ${siteConfig.url}/admin/pedidos/${order.id}`,
        ].join("\n"),
      ),
    whatsappNotifyEnabled(),
  );
  await safely("pedido creado (admin)", () => sendMail({ to: notifyEmails(), replyTo: order.customer.email, ...adminCreatedMail(order, url, adminUrl, paymentState(order)) }));
}

/** Pago acreditado (Mercado Pago o transferencia confirmada desde el admin): la venta está en marcha. */
export async function notifyOrderPaid(order: Order) {
  const url = publicOrderUrl(order);
  const adminUrl = `${siteConfig.url}/admin/pedidos/${order.id}`;
  await safely("pago confirmado (clienta)", () => sendMail({ to: order.customer.email ?? "", ...customerPaidMail(order, url) }));
  await safely(
    "pago confirmado (WhatsApp)",
    () =>
      sendWhatsapp(
        [
          `✅ *PAGO ACREDITADO · PEDIDO ${order.number}*`,
          `Se acreditaron ${formatARS(order.total)} por ${PAYMENT_LABEL[order.payment.method]}. Ya podés hacerlo.`,
          "",
          waCard(order),
          "",
          `🔗 ${siteConfig.url}/admin/pedidos/${order.id}`,
        ].join("\n"),
      ),
    whatsappNotifyEnabled(),
  );
  await safely("pago confirmado (admin)", () => sendMail({ to: notifyEmails(), replyTo: order.customer.email, ...adminPaidMail(order, adminUrl) }));
}
