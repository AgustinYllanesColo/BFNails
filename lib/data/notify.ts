import "server-only";
import type { Order } from "@/lib/types";
import { PAYMENT_LABEL } from "@/lib/types";
import { formatARS } from "@/lib/format";
import { describeItem } from "@/lib/whatsapp";
import { siteConfig } from "@/lib/site";
import { mailEnabled, notifyEmails, sendMail } from "@/lib/mail";
import { sendWhatsapp, whatsappNotifyEnabled } from "@/lib/whatsapp-notify";
import { publicOrderUrl } from "./orders";

/**
 * Avisos por mail de cada pedido: a la clienta (con su número de pedido y el link para seguirlo) y a Brenda
 * (ORDER_NOTIFY_EMAILS). Nunca rompen el pedido: si el mail falla queda en el log y el pedido sigue.
 */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

function itemsText(order: Order): string {
  return order.items.map((i) => describeItem(i, { link: false })).join("\n");
}

function summaryText(order: Order): string {
  const addr = order.delivery.address;
  const where = addr?.street ? `\nDirección: ${[addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(", ")}` : "";
  return [
    itemsText(order),
    "",
    `Entrega: ${order.delivery.label}${order.delivery.cost ? ` (${formatARS(order.delivery.cost)})` : ""}${where}`,
    `Pago: ${PAYMENT_LABEL[order.payment.method]}`,
    `Total: ${formatARS(order.total)}`,
  ].join("\n");
}

function html(title: string, paragraphs: string[], order: Order, url: string): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join("");
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6efe6;font-family:Georgia,serif;color:#2a1a16">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<p style="margin:0 0 20px;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#7a2a2a">BF Nails Studio · Pedido ${esc(order.number)}</p>
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#4a0e0e">${esc(title)}</h1>
${body}
<pre style="white-space:pre-wrap;background:#fff;border:1px solid #e8d9cf;border-radius:10px;padding:16px;font:14px/1.5 Georgia,serif">${esc(summaryText(order))}</pre>
<p style="margin:20px 0"><a href="${esc(url)}" style="display:inline-block;background:#4a0e0e;color:#f6efe6;text-decoration:none;padding:12px 20px;border-radius:999px">Ver mi pedido</a></p>
<p style="margin:0;font-size:12px;color:#7a6a64">BF Nails Studio · ${esc(siteConfig.url)}</p>
</div></body></html>`;
}

async function safely(label: string, fn: () => Promise<unknown>, enabled = mailEnabled()) {
  if (!enabled) return;
  try {
    await fn();
  } catch (err) {
    console.error(`[aviso] ${label} falló`, err);
  }
}

/** Resumen corto para el WhatsApp de Brenda. */
function shortItems(order: Order): string {
  return order.items.map((i) => `${i.qty}× ${i.kind === "custom" ? "Set a medida" : i.kind === "charm" ? `Dije ${i.name}` : i.name}`).join(", ");
}

/** Pedido creado: número de pedido a la clienta y aviso a Brenda. */
export async function notifyOrderCreated(order: Order) {
  const url = publicOrderUrl(order);
  const first = order.customer.name.split(" ")[0];
  const next =
    order.status === "a_confirmar"
      ? "Hay detalles para cotizar: Brenda revisa tu pedido y te confirma el precio final por WhatsApp antes del pago."
      : order.payment.method === "mercadopago"
        ? "Si ya pagaste con Mercado Pago, te llega otro mail cuando se acredite. Si no, podés pagar desde el link de tu pedido."
        : order.payment.method === "transferencia"
          ? `Para confirmarlo, transferí ${formatARS(order.total)} al alias ${siteConfig.transfer.alias} y mandá el comprobante por WhatsApp.`
          : "Lo pagás en efectivo cuando lo recibas. Confirmá por WhatsApp y arrancamos.";
  await safely("pedido creado (clienta)", () =>
    sendMail({
      to: order.customer.email ?? "",
      subject: `Tu pedido ${order.number} en BF Nails Studio`,
      text: [`Hola ${first}! Recibí tu pedido ${order.number}.`, "", summaryText(order), "", next, `Seguilo acá: ${url}`].join("\n"),
      html: html(`Recibí tu pedido, ${esc(first)}`, [esc(next)], order, url),
    }),
  );
  await safely(
    "pedido creado (WhatsApp)",
    () =>
      sendWhatsapp(
        `🐱 Nuevo pedido *${order.number}* de ${order.customer.name} (${order.customer.whatsapp}): ${shortItems(order)}. ${order.delivery.label}. Total ${formatARS(order.total)}, ${PAYMENT_LABEL[order.payment.method]}${order.status === "a_confirmar" ? " · A CONFIRMAR precio" : ""}. ${siteConfig.url}/admin/pedidos/${order.id}`,
      ),
    whatsappNotifyEnabled(),
  );
  await safely("pedido creado (admin)", () =>
    sendMail({
      to: notifyEmails(),
      subject: `Nuevo pedido ${order.number} · ${order.customer.name} · ${formatARS(order.total)}`,
      text: [`Nuevo pedido ${order.number} de ${order.customer.name} (WhatsApp ${order.customer.whatsapp}${order.customer.email ? `, ${order.customer.email}` : ""}).`, `Estado: ${order.status}.`, "", summaryText(order), "", `Pedido: ${url}`, `Admin: ${siteConfig.url}/admin/pedidos/${order.id}`].join("\n"),
      replyTo: order.customer.email,
    }),
  );
}

/** Pago acreditado (Mercado Pago o transferencia confirmada desde el admin): la venta está en marcha. */
export async function notifyOrderPaid(order: Order) {
  const url = publicOrderUrl(order);
  const first = order.customer.name.split(" ")[0];
  const msg = "Recibí el pago y tu set ya está en marcha. Te aviso por WhatsApp cuando esté listo para entregar o enviar.";
  await safely("pago confirmado (clienta)", () =>
    sendMail({
      to: order.customer.email ?? "",
      subject: `Pago confirmado · pedido ${order.number} en marcha`,
      text: [`Hola ${first}! ${msg}`, "", summaryText(order), "", `Seguilo acá: ${url}`].join("\n"),
      html: html(`¡Gracias, ${esc(first)}! Tu set está en marcha`, [esc(msg)], order, url),
    }),
  );
  await safely(
    "pago confirmado (WhatsApp)",
    () => sendWhatsapp(`✨ Venta confirmada *${order.number}*: se acreditó ${formatARS(order.total)} de ${order.customer.name} (${PAYMENT_LABEL[order.payment.method]}). ${shortItems(order)}. ${siteConfig.url}/admin/pedidos/${order.id}`),
    whatsappNotifyEnabled(),
  );
  await safely("pago confirmado (admin)", () =>
    sendMail({
      to: notifyEmails(),
      subject: `Venta confirmada ${order.number} · ${order.customer.name} · ${formatARS(order.total)}`,
      text: [`Se acreditó el pago del pedido ${order.number} (${PAYMENT_LABEL[order.payment.method]}${order.payment.mpPaymentId ? `, pago MP #${order.payment.mpPaymentId}` : ""}).`, `Clienta: ${order.customer.name}, WhatsApp ${order.customer.whatsapp}${order.customer.email ? `, ${order.customer.email}` : ""}.`, "", summaryText(order), "", `Admin: ${siteConfig.url}/admin/pedidos/${order.id}`].join("\n"),
      replyTo: order.customer.email,
    }),
  );
}
