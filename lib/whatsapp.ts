import { siteConfig } from "./site";
import { formatARS, formatCm } from "./format";
import type { BuilderSelection, CartItem, Order, SizeSelection } from "./types";
import { ORDER_STATUS_LABEL } from "./types";
import { describeNails } from "./charms";
import { allNails, describeNailList } from "./nails";
import { DEFAULT_BUILDER_CONFIG } from "./pricing";
import { DEFAULT_CHARMS } from "./data/content";
import { SEED_DESIGNS } from "./data/catalog";
import { builderLink } from "./share";
import { orderDiscount } from "./promos";

/** Nombre legible de una opción del armador (forma, largo, acabado, color o técnica); si no se conoce, el id. */
function label(kind: "shapes" | "lengths" | "finishes" | "bases" | "extras", id: string): string {
  const found = (DEFAULT_BUILDER_CONFIG[kind] as Array<{ id: string; label: string }>).find((o) => o.id === id);
  return (found?.label ?? id).toLowerCase();
}
const extrasLabel = (ids: string[]) => ids.map((e) => label("extras", e)).join(", ");
const charmName = (id: string) => DEFAULT_CHARMS.find((c) => c.id === id)?.name ?? id;

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

/** Detalle de un item. `link`: con el link para verlo en 3D (en el mensaje de WhatsApp; las páginas ponen su propio botón). */
export function describeItem(item: CartItem, opts: { link?: boolean } = {}): string {
  const sizes = describeSizes(item.sizes);
  if (item.kind === "design") {
    const variant =
      item.shape || item.length ? ` · ${[item.shape, item.length].filter(Boolean).join(", ")}` : "";
    return `• ${item.name} x${item.qty} (${sizes}${variant}) – ${formatARS(item.unitPrice * item.qty)}`;
  }
  const s = item.selection;
  const extras = s.extras.length
    ? `, ${extrasLabel(s.extras)}${s.tipColor && (s.extras.includes("francesita-color") || s.extras.includes("francesita")) ? ` (punta ${label("bases", s.tipColor)})` : ""}${
        s.detailColor ? ` (diseño en ${label("bases", s.detailColor)})` : ""
      }${s.degradeColor ? ` (degradé hacia ${label("bases", s.degradeColor)})` : ""}`
    : "";
  // uña por uña: las que no son como el resto del set, agrupadas si llevan lo mismo
  const groups = new Map<string, number[]>();
  allNails(s).forEach((sp, i) => {
    if (!sp.custom) return;
    const key = `${sp.color}|${sp.extras.join(",")}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  const accent = [...groups.entries()]
    .map(([key, idx]) => {
      const [color, extras] = key.split("|");
      const list = extras ? extrasLabel(extras.split(",")) : "";
      return `\n  ${describeNailList(idx)}: ${label("bases", color)}${list ? ` con ${list}` : " liso"}`;
    })
    .join("");
  const charms = s.charms?.length
    ? `\n  Dijes: ${s.charms
        .map((c) => {
          const where = describeNails(c.nails);
          return `${charmName(c.id)} ×${c.qty}${where ? ` (${where})` : ""}`;
        })
        .join(", ")}`
    : "";
  const from = SEED_DESIGNS.find((d) => d.slug === (s.from ?? s.art));
  const origin = from ? `\n  Parte de: ${from.name}${isPresetUntouched(s) ? "" : " (modificado)"}` : "";
  const notes = s.notes ? `\n  Nota: ${s.notes}` : "";
  const ref = s.referenceUrl ? `\n  Referencia: ${s.referenceUrl}` : "";
  const view = opts.link === false ? "" : `\n  Verlo en 3D: ${builderLink(s)}`;
  return `• Diseño propio x${item.qty} (${sizes})\n  ${label("shapes", s.shape)}, ${label("lengths", s.length)}, ${label("finishes", s.finish)}, base ${label("bases", s.base)}${extras}${charms}${accent}${origin}${notes}${ref}${view}\n  ${formatARS(item.unitPrice * item.qty)}${item.quote.needsConfirmation ? " (a confirmar)" : ""}`;
}

/** ¿La selección sigue siendo la receta del catálogo tal cual (misma forma, largo, acabado y base)? */
function isPresetUntouched(s: BuilderSelection): boolean {
  const d = SEED_DESIGNS.find((x) => x.slug === s.from);
  // sigue con su dibujo (no tocó técnicas ni uñas) y con la misma forma, largo y acabado
  return Boolean(d && s.art === s.from && d.shape === s.shape && d.length === s.length && d.finish === s.finish);
}

/** Mensaje que la clienta le manda a Brenda para confirmar el pedido. */
export function orderConfirmationMessage(order: Order, orderUrl: string): string {
  const items = order.items.map((i) => describeItem(i, { link: true })).join("\n");
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
    ...(orderDiscount(order) ? [`Promos: -${formatARS(orderDiscount(order))}`] : []),
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
