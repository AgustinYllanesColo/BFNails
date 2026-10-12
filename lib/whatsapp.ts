import { siteConfig } from "./site";
import { formatARS } from "./format";
import { DEFAULT_BUILDER_CONFIG, type BuilderConfig } from "./pricing";
import type { Address, BuilderSelection, CartItem, Order, PaymentMethod, SizeSelection } from "./types";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL } from "./types";

/** Link wa.me con mensaje prearmado. `to` sin "+" ni espacios; por defecto, Brenda. */
export function waLink(message: string, to: string = siteConfig.whatsapp): string {
  const num = to.replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function describeSizes(sizes: SizeSelection): string {
  if (sizes.mode === "standard") return `Talle ${sizes.size}`;
  if (sizes.mode === "custom") return `Medidas (mm): ${sizes.mm.join(" · ")}`;
  return "Talle a definir por WhatsApp";
}

/** Talle en una palabra para el ticket y la línea del carrito ("Talle S", "A medida", "Por WhatsApp"). */
export function shortSizes(sizes: SizeSelection): string {
  if (sizes.mode === "standard") return `Talle ${sizes.size}`;
  if (sizes.mode === "custom") return "A medida · 10 medidas";
  return "Talle por WhatsApp";
}

/** Nombre visible de una línea: los sets del armador se llaman "Tu diseño" (el detalle va en las etiquetas). */
export function itemName(item: CartItem): string {
  return item.kind === "custom" ? "Tu diseño" : item.name;
}

/**
 * Etiquetas legibles de un set del armador, en el orden en que se elige: forma, largo, acabado, color y técnicas
 * ("Coffin · Largo · Cromado · Bordó · Francesita · Strass (hasta 10)"). La francesita de color dice su punta.
 */
export function customLabels(sel: BuilderSelection, config: BuilderConfig = DEFAULT_BUILDER_CONFIG): string[] {
  const label = <T extends { id: string; label: string }>(list: T[], id: string | undefined) =>
    list.find((o) => o.id === id)?.label ?? id ?? "";
  const extras = sel.extras.map((id) => {
    const name = label(config.extras, id);
    if (id === "francesita-color") return `${name} (punta ${label(config.bases, sel.tipColor ?? "bordo").toLowerCase()})`;
    return name;
  });
  return [
    label(config.shapes, sel.shape),
    label(config.lengths, sel.length),
    label(config.finishes, sel.finish),
    label(config.bases, sel.base),
    ...extras,
  ].filter(Boolean);
}

/** Una línea del pedido para WhatsApp (los sets del armador con sus etiquetas, nota y referencia). */
export function describeItem(item: CartItem): string {
  return describeCartItem(item, DEFAULT_BUILDER_CONFIG);
}

/** `describeItem` con la configuración del armador que está vigente (etiquetas editadas desde el admin). */
export function describeCartItem(item: CartItem, config: BuilderConfig): string {
  const sizes = describeSizes(item.sizes);
  if (item.kind === "design") {
    return `• ${item.name} x${item.qty} (${sizes}) · ${formatARS(item.unitPrice * item.qty)}`;
  }
  const s = item.selection;
  const notes = s.notes ? `\n  Nota: ${s.notes}` : "";
  const ref = s.referenceUrl ? `\n  Referencia: ${s.referenceUrl}` : "";
  return `• Tu diseño x${item.qty} (${sizes})\n  ${customLabels(s, config).join(" · ")}${notes}${ref}\n  ${formatARS(item.unitPrice * item.qty)}${item.quote.needsConfirmation ? " (a confirmar)" : ""}`;
}

function addressLine(address?: Address): string | null {
  if (!address) return null;
  const parts = [address.street, address.city, address.province, address.postalCode ? `CP ${address.postalCode}` : undefined]
    .map((p) => p?.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  const notes = address.notes?.trim() ? ` (${address.notes.trim()})` : "";
  return `${parts.join(", ")}${notes}`;
}

export type CartMessageDetails = {
  name: string;
  whatsapp: string;
  email?: string;
  /** Forma de entrega elegida. `cost` vacío = a confirmar (Correo sin cotizar); `from` = precio "desde" (moto). */
  delivery: { label: string; cost?: number | null; from?: boolean };
  payment: PaymentMethod;
  address?: Address;
  total: number;
  needsConfirmation: boolean;
};

/**
 * Pedido completo para mandarle a Bren por WhatsApp cuando la web no toma pedidos (modo WhatsApp del checkout): cada
 * set con su talle y precio, entrega, dirección, pago, total y quién lo pide. Es el mismo detalle que guardaría la
 * base: Bren lo puede cargar tal cual.
 */
export function cartWhatsAppMessage(
  items: CartItem[],
  d: CartMessageDetails,
  config: BuilderConfig = DEFAULT_BUILDER_CONFIG,
): string {
  const lines = items.map((i) => describeCartItem(i, config)).join("\n");
  const cost =
    d.delivery.cost == null
      ? " (costo a confirmar)"
      : d.delivery.cost === 0
        ? " (sin costo)"
        : ` (${d.delivery.from ? "desde " : ""}${formatARS(d.delivery.cost)}${d.delivery.from ? ", a confirmar" : ""})`;
  const address = addressLine(d.address);
  const toConfirm = d.needsConfirmation || d.delivery.from || d.delivery.cost == null;
  const contact = [`Soy ${d.name.trim()}`, `WhatsApp ${d.whatsapp.trim()}`, d.email?.trim() ? `mail ${d.email.trim()}` : null]
    .filter(Boolean)
    .join(" · ");
  return [
    "Hola Bren! Quiero hacer este pedido desde la web 🐱",
    "",
    lines,
    "",
    `Entrega: ${d.delivery.label}${cost}`,
    ...(address ? [`Dirección: ${address}`] : []),
    `Pago: ${PAYMENT_LABEL[d.payment]}`,
    toConfirm ? `Total desde: *${formatARS(d.total)}* (me confirmás el final)` : `Total: *${formatARS(d.total)}*`,
    "",
    `${contact}.`,
    ...(d.needsConfirmation ? ["", "Hay detalles a cotizar, ¿me confirmás el precio final?"] : []),
  ].join("\n");
}

/** Mensaje que la clienta le manda a Brenda para confirmar el pedido. El alias y el titular salen de la configuración. */
export function orderConfirmationMessage(
  order: Order,
  orderUrl: string,
  transfer: { alias: string; holder?: string } = siteConfig.transfer,
): string {
  const items = order.items.map(describeItem).join("\n");
  const pay =
    order.payment.method === "transferencia"
      ? `Pago: transferencia al alias ${transfer.alias}${transfer.holder ? ` (${transfer.holder})` : ""}. Te mando el comprobante por acá.`
      : order.payment.method === "efectivo"
        ? "Pago: en efectivo cuando lo reciba."
        : order.payment.mpPaymentId
          ? `Pago: Mercado Pago (pago #${order.payment.mpPaymentId}).`
          : "Pago: Mercado Pago.";
  const confirm = order.needsConfirmation ? "\n\nHay detalles a cotizar, ¿me confirmás el precio final?" : "";
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

/** "Prefiero transferir" después de un pago fallido de Mercado Pago. */
export function transferInsteadMessage(order: Order, orderUrl: string): string {
  return [
    `Hola Bren! Quiero pagar el pedido *${order.number}* por transferencia 🐱`,
    `Total: *${formatARS(order.total)}*`,
    `Pedido: ${orderUrl}`,
  ].join("\n");
}

/** Link del pedido que no abre (not-found del pedido). */
export const ORDER_HELP_MESSAGE = "Hola Bren! No puedo abrir mi pedido 🐱";

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
  estado: (o: Order) => `Hola ${o.customer.name}! Tu pedido ${o.number} está: ${ORDER_STATUS_LABEL[o.status]}.`,
};
