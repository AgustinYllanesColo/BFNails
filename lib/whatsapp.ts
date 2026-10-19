import { siteConfig } from "./site";
import { formatARS, formatCm } from "./format";
import type { CartItem, Order, SizeSelection } from "./types";
import { ORDER_STATUS_LABEL } from "./types";

/** Link wa.me con mensaje prearmado. `to` sin "+" ni espacios; por defecto, Brenda. */
export function waLink(message: string, to: string = siteConfig.whatsapp): string {
  const num = to.replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function describeSizes(sizes: SizeSelection): string {
  if (sizes.mode === "standard") return `Medida ${sizes.size}`;
  if (sizes.mode === "custom") return `Medidas (cm): ${sizes.mm.map(formatCm).join(" · ")}`;
  return "Medida a definir por WhatsApp";
}

export function describeItem(item: CartItem): string {
  const sizes = describeSizes(item.sizes);
  if (item.kind === "design") {
    const variant =
      item.shape || item.length ? ` · ${[item.shape, item.length].filter(Boolean).join(", ")}` : "";
    return `• ${item.name} x${item.qty} (${sizes}${variant}) – ${formatARS(item.unitPrice * item.qty)}`;
  }
  const s = item.selection;
  const extras = s.extras.length
    ? `, extras: ${s.extras.join(", ")}${s.tipColor ? ` (punta ${s.tipColor})` : ""}${s.detailColor ? ` (diseño en ${s.detailColor})` : ""}${
        s.accent === "acento" ? " · diseño solo en el anular" : s.accent === "alternadas" ? " · diseño una sí, una no" : ""
      }`
    : "";
  const charms = s.charms?.length ? `, dijes: ${s.charms.map((c) => `${c.id} ×${c.qty}`).join(", ")}` : "";
  const notes = s.notes ? `\n  Nota: ${s.notes}` : "";
  const ref = s.referenceUrl ? `\n  Referencia: ${s.referenceUrl}` : "";
  return `• Diseño propio x${item.qty} (${sizes})\n  ${s.shape}, ${s.length}, ${s.finish}, base ${s.base}${extras}${charms}${notes}${ref}\n  ${formatARS(item.unitPrice * item.qty)}${item.quote.needsConfirmation ? " (a confirmar)" : ""}`;
}

/** Mensaje que la clienta le manda a Brenda para confirmar el pedido. */
export function orderConfirmationMessage(order: Order, orderUrl: string): string {
  const items = order.items.map(describeItem).join("\n");
  const pay =
    order.payment.method === "transferencia"
      ? `Pago: transferencia al alias ${siteConfig.transfer.alias}. Te mando el comprobante por acá.`
      : order.payment.method === "efectivo"
        ? "Pago: en efectivo cuando lo reciba."
        : order.payment.mpPaymentId
          ? `Pago: Mercado Pago (pago #${order.payment.mpPaymentId}).`
          : "Pago: Mercado Pago.";
  const confirm = order.needsConfirmation
    ? "\n\nHay detalles a cotizar, ¿me confirmás el precio final?"
    : "";
  return [
    `Hola Bren! Hice el pedido *${order.number}* desde la web 🐱`,
    "",
    items,
    "",
    `Entrega: ${order.delivery.label}${order.delivery.cost ? ` (${formatARS(order.delivery.cost)})` : ""}`,
    `Total: *${formatARS(order.total)}*`,
    pay,
    `Soy ${order.customer.name}.`,
    `Pedido: ${orderUrl}${confirm}`,
  ].join("\n");
}

/** Mensajes que Brenda le manda a la clienta desde el admin. */
export const adminMessages = {
  precioConfirmado: (o: Order, payUrl: string) =>
    `Hola ${o.customer.name}! Ya revisé tu pedido ${o.number} 🐱 El precio final es ${formatARS(o.total)}. Podés pagarlo acá: ${payUrl}`,
  pagoRecibido: (o: Order) =>
    `Hola ${o.customer.name}! Recibí el pago de tu pedido ${o.number} ✨ Ya me pongo a hacer tus uñas. Te aviso cuando estén listas.`,
  listo: (o: Order) =>
    `Hola ${o.customer.name}! Tu set ${o.number} está listo 💅 ${
      o.delivery.method === "retiro"
        ? "¿Cuándo te queda bien para coordinar la entrega en la estación?"
        : o.delivery.method === "moto"
          ? "¿Cuándo te queda bien que te lo lleve?"
          : "Lo despacho por Correo Argentino y te paso el tracking."
    }`,
  enviado: (o: Order) =>
    `Hola ${o.customer.name}! Despaché tu pedido ${o.number} 📦 Tu número de seguimiento es ${o.tracking ?? "(a cargar)"}. Lo seguís en correoargentino.com.ar/seguimiento`,
  estado: (o: Order) =>
    `Hola ${o.customer.name}! Tu pedido ${o.number} está: ${ORDER_STATUS_LABEL[o.status]}.`,
};
