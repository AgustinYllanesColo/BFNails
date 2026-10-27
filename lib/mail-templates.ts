import type { CartItem, Order, OrderStatus } from "@/lib/types";
import { PAYMENT_LABEL } from "@/lib/types";
import { formatARS } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { describeItem, describeSizes } from "@/lib/whatsapp";
import { LENGTH_LABEL, SHAPE_LABEL } from "@/lib/data/catalog";

/**
 * Mails de pedido con la estética del sitio: crema, bordó, estrellas y la kitty. Son funciones puras (texto y HTML)
 * para poder verlos y probarlos sin mandar nada. Todo el CSS va inline porque los clientes de mail no cargan hojas
 * de estilo, y las imágenes son URLs absolutas del sitio.
 */

const C = {
  cream: "#fef7e7",
  creamDeep: "#f5e8c8",
  creamInk: "#e7d6ad",
  bordo: "#4a0e0e",
  bordoSoft: "#6b1a1a",
  ink: "#3c3c3c",
  inkSoft: "#5e5e5e",
  yellow: "#f5c400",
  leopard: "#c9a063",
  white: "#fffdf8",
  green: "#1f7a4d",
};
const FONT = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";
const DISPLAY = "'Shrikhand', Georgia, 'Times New Roman', serif";

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

// las imágenes siempre apuntan al sitio publicado (en local y en los tests, siteConfig.url es localhost)
const ASSET_BASE = /^https?:\/\/localhost/.test(siteConfig.url) ? "https://bf-nails.vercel.app" : siteConfig.url;
const abs = (path: string) => (path.startsWith("http") ? path : `${ASSET_BASE}${path}`);

const FLOW: Array<{ status: OrderStatus; label: string }> = [
  { status: "pendiente_pago", label: "Recibido" },
  { status: "pagado", label: "Pagado" },
  { status: "en_produccion", label: "En producción" },
  { status: "listo", label: "Listo" },
  { status: "entregado", label: "Entregado" },
];

const paid = (s: OrderStatus) => ["pagado", "en_produccion", "listo", "enviado", "entregado"].includes(s);

/* ---------- piezas ---------- */

function itemRow(item: CartItem): string {
  const image = item.kind !== "custom" && item.image ? abs(item.image) : null;
  const thumb = image
    ? `<img src="${esc(image)}" width="64" height="80" alt="" style="display:block;width:64px;height:80px;object-fit:cover;border-radius:10px;border:1px solid ${C.creamInk}">`
    : `<div style="width:64px;height:80px;border-radius:10px;background:${C.creamDeep};border:1px solid ${C.creamInk};text-align:center;line-height:80px;font-size:26px">💅</div>`;
  const name = item.kind === "custom" ? "Set a medida" : item.kind === "charm" ? `Dije ${item.name}` : item.name;
  const detail =
    item.kind === "charm"
      ? "Suelto, sin set"
      : item.kind === "design"
        ? [item.shape && SHAPE_LABEL[item.shape], item.length && LENGTH_LABEL[item.length], describeSizes(item.sizes)].filter(Boolean).join(" · ")
        : describeSizes(item.sizes);
  // el set a medida lleva su receta completa (lo que describe el WhatsApp), sin el link 3D
  const recipe =
    item.kind === "custom"
      ? `<div style="margin-top:6px;font-size:12px;line-height:1.5;color:${C.inkSoft};white-space:pre-wrap">${esc(describeItem(item, { link: false }).split("\n").slice(1, -1).join("\n").replace(/^\s+/gm, ""))}</div>`
      : "";
  return `<tr>
<td style="padding:12px 0;border-bottom:1px solid ${C.creamInk};vertical-align:top;width:64px">${thumb}</td>
<td style="padding:12px 12px;border-bottom:1px solid ${C.creamInk};vertical-align:top">
  <div style="font-weight:700;font-size:15px;color:${C.ink}">${esc(name)} <span style="font-weight:400;color:${C.inkSoft}">×${item.qty}</span></div>
  <div style="margin-top:3px;font-size:13px;color:${C.inkSoft}">${esc(detail)}</div>${recipe}
</td>
<td style="padding:12px 0;border-bottom:1px solid ${C.creamInk};vertical-align:top;text-align:right;white-space:nowrap;font-weight:700;color:${C.bordo}">${formatARS(item.unitPrice * item.qty)}</td>
</tr>`;
}

function totals(order: Order): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;font-size:${strong ? 16 : 14}px;color:${strong ? C.bordo : C.inkSoft};font-weight:${strong ? 700 : 400}">${esc(label)}</td><td style="padding:6px 0;text-align:right;font-size:${strong ? 18 : 14}px;color:${C.bordo};font-weight:700">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
${row("Subtotal", formatARS(order.subtotal))}
${row(`Entrega · ${order.delivery.label}`, order.delivery.cost ? formatARS(order.delivery.cost) : "Gratis")}
${row("Total", formatARS(order.total), true)}
</table>`;
}

function address(order: Order): string {
  const a = order.delivery.address;
  if (!a?.street) return "";
  const line = [a.street, a.city, a.province, a.postalCode].filter(Boolean).join(", ");
  return `<p style="margin:10px 0 0;font-size:13px;color:${C.inkSoft}">📍 ${esc(line)}${a.notes ? ` · ${esc(a.notes)}` : ""}</p>`;
}

function steps(order: Order): string {
  const idx = Math.max(0, FLOW.findIndex((f) => f.status === order.status));
  const cells = FLOW.map((f, i) => {
    const done = i <= idx;
    return `<td style="text-align:center;padding:0 2px;vertical-align:top">
<div style="width:22px;height:22px;line-height:22px;margin:0 auto;border-radius:999px;font-size:12px;font-weight:700;background:${done ? C.bordo : C.creamDeep};color:${done ? C.cream : C.inkSoft};border:1px solid ${done ? C.bordo : C.creamInk}">${done ? "★" : i + 1}</div>
<div style="margin-top:6px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${done ? C.bordo : C.inkSoft};font-weight:${done ? 700 : 400}">${esc(f.label)}</div>
</td>`;
  }).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 4px"><tr>${cells}</tr></table>`;
}

function button(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${C.bordo};color:${C.cream};text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px">${esc(label)}</a>`;
}

type Layout = {
  eyebrow: string;
  title: string; // puede traer <em> para la palabra en bordó
  intro: string[]; // párrafos (HTML ya escapado)
  order: Order;
  cta: { href: string; label: string };
  afterCta?: string;
  preheader?: string;
};

export function layout(l: Layout): string {
  const o = l.order;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(l.title.replace(/<[^>]+>/g, ""))}</title></head>
<body style="margin:0;padding:0;background:${C.cream};font-family:${FONT};color:${C.ink};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(l.preheader ?? "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
  <tr><td align="center" style="padding:0 0 18px">
    <img src="${abs("/brand/logo-nails.png")}" width="210" alt="BF Nails Studio" style="display:block;width:210px;max-width:60%;height:auto">
  </td></tr>
  <tr><td style="background:${C.white};border:1px solid ${C.creamInk};border-radius:22px;padding:30px 28px">
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${C.leopard};font-weight:700">${esc(l.eyebrow)}</p>
    <h1 style="margin:0 0 14px;font-family:${DISPLAY};font-weight:400;font-size:34px;line-height:1.05;color:${C.ink}">${l.title}</h1>
    ${l.intro.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${C.ink}">${p}</p>`).join("")}
    ${steps(o)}
    <div style="margin:22px 0 6px;padding:4px 16px 12px;background:${C.cream};border:1px solid ${C.creamInk};border-radius:16px">
      <p style="margin:12px 0 2px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.inkSoft};font-weight:700">Pedido ${esc(o.number)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${o.items.map(itemRow).join("")}</table>
      ${totals(o)}
      ${address(o)}
      <p style="margin:10px 0 4px;font-size:13px;color:${C.inkSoft}">💳 ${esc(PAYMENT_LABEL[o.payment.method])}${o.payment.mpPaymentId ? ` · pago #${esc(o.payment.mpPaymentId)}` : ""}</p>
    </div>
    <p style="margin:22px 0 0;text-align:center">${button(l.cta.href, l.cta.label)}</p>
    ${l.afterCta ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:${C.inkSoft};text-align:center">${l.afterCta}</p>` : ""}
  </td></tr>
  <tr><td align="center" style="padding:22px 10px 0">
    <img src="${abs("/brand/kitty-icon.png")}" width="44" alt="" style="display:block;width:44px;height:auto;margin:0 auto 10px">
    <p style="margin:0;font-size:12px;line-height:1.7;color:${C.inkSoft}">
      BF Nails Studio · Remedios de Escalada, Lanús, Banfield y envíos a todo el país<br>
      <a href="https://wa.me/${esc(siteConfig.whatsapp)}" style="color:${C.bordo};font-weight:700;text-decoration:none">WhatsApp</a> &nbsp;·&nbsp;
      <a href="${esc(siteConfig.instagram)}" style="color:${C.bordo};font-weight:700;text-decoration:none">${esc(siteConfig.instagramHandle)}</a> &nbsp;·&nbsp;
      <a href="${esc(siteConfig.url)}" style="color:${C.bordo};font-weight:700;text-decoration:none">${esc(siteConfig.url.replace(/^https?:\/\//, ""))}</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/* ---------- texto plano (para clientes sin HTML) ---------- */

export function summaryText(order: Order): string {
  const a = order.delivery.address;
  const where = a?.street ? `\nDirección: ${[a.street, a.city, a.province, a.postalCode].filter(Boolean).join(", ")}` : "";
  return [
    order.items.map((i) => describeItem(i, { link: false })).join("\n"),
    "",
    `Entrega: ${order.delivery.label}${order.delivery.cost ? ` (${formatARS(order.delivery.cost)})` : ""}${where}`,
    `Pago: ${PAYMENT_LABEL[order.payment.method]}`,
    `Total: ${formatARS(order.total)}`,
  ].join("\n");
}

/* ---------- los cuatro mails ---------- */

const first = (o: Order) => o.customer.name.trim().split(/\s+/)[0] || "hola";

export function nextStep(order: Order): string {
  if (order.status === "a_confirmar") return "Hay detalles para cotizar: Brenda revisa tu pedido y te confirma el precio final por WhatsApp antes del pago.";
  if (order.payment.method === "mercadopago") return "Si ya pagaste con Mercado Pago, te llega otro mail cuando se acredite. Si no, podés pagar desde el botón de abajo.";
  if (order.payment.method === "transferencia") return `Para confirmarlo, transferí ${formatARS(order.total)} al alias ${siteConfig.transfer.alias} (${siteConfig.transfer.holder}) y mandá el comprobante por WhatsApp.`;
  return "Lo pagás en efectivo cuando lo recibas. Confirmá por WhatsApp y arrancamos.";
}

export function customerCreatedMail(order: Order, url: string) {
  const name = first(order);
  const next = nextStep(order);
  return {
    subject: `Tu pedido ${order.number} en BF Nails Studio`,
    text: [`Hola ${name}! Recibí tu pedido ${order.number}.`, "", summaryText(order), "", next, `Seguilo acá: ${url}`].join("\n"),
    html: layout({
      preheader: `Pedido ${order.number} recibido. ${next}`,
      eyebrow: "Recibí tu pedido",
      title: `¡Gracias, <span style="color:${C.bordo}">${esc(name)}</span>!`,
      intro: [`Tu pedido <strong>${esc(order.number)}</strong> ya está anotado. ${esc(next)}`],
      order,
      cta: { href: url, label: order.payment.method === "mercadopago" && !paid(order.status) ? "Ver mi pedido y pagar" : "Ver mi pedido" },
      afterCta: "¿Dudas? Escribime por WhatsApp y lo vemos juntas. 🐱",
    }),
  };
}

export function customerPaidMail(order: Order, url: string) {
  const name = first(order);
  const msg = "Recibí el pago y tu set ya está en marcha. Te aviso por WhatsApp cuando esté listo para entregar o enviar.";
  return {
    subject: `Pago confirmado · pedido ${order.number} en marcha`,
    text: [`Hola ${name}! ${msg}`, "", summaryText(order), "", `Seguilo acá: ${url}`].join("\n"),
    html: layout({
      preheader: `Pago confirmado. Tu pedido ${order.number} está en marcha.`,
      eyebrow: "Pago confirmado",
      title: `Tu set está <span style="color:${C.bordo}">en marcha</span> ✨`,
      intro: [`Gracias, ${esc(name)}. ${esc(msg)}`],
      order,
      cta: { href: url, label: "Seguir mi pedido" },
      afterCta: "Mientras tanto, mirá el tutorial de colocación en el sitio para que te queden perfectas.",
    }),
  };
}

export function adminCreatedMail(order: Order, url: string, adminUrl: string, state: string) {
  return {
    subject: `Nuevo pedido ${order.number} (${order.status === "a_confirmar" ? "a confirmar" : order.payment.method === "efectivo" ? "efectivo al recibir" : "pendiente de pago"}) · ${order.customer.name} · ${formatARS(order.total)}`,
    text: [`Nuevo pedido ${order.number} de ${order.customer.name} (WhatsApp ${order.customer.whatsapp}, ${order.customer.email ?? "sin mail"}).`, `Estado: ${state}.`, "", summaryText(order), "", `Pedido: ${url}`, `Admin: ${adminUrl}`].join("\n"),
    html: layout({
      preheader: `${order.customer.name} · ${formatARS(order.total)} · ${state}`,
      eyebrow: "Nuevo pedido · todavía no está pago",
      title: `Pedido <span style="color:${C.bordo}">${esc(order.number)}</span>`,
      intro: [
        `👤 <strong>${esc(order.customer.name)}</strong> · <a href="https://wa.me/${esc(order.customer.whatsapp)}" style="color:${C.bordo}">WhatsApp</a>${order.customer.email ? ` · <a href="mailto:${esc(order.customer.email)}" style="color:${C.bordo}">${esc(order.customer.email)}</a>` : ""}`,
        `⏳ ${esc(state)}.`,
      ],
      order,
      cta: { href: adminUrl, label: "Abrir en el panel" },
    }),
  };
}

export function adminPaidMail(order: Order, adminUrl: string) {
  return {
    subject: `Venta confirmada ${order.number} · ${order.customer.name} · ${formatARS(order.total)}`,
    text: [`Se acreditó el pago del pedido ${order.number} (${PAYMENT_LABEL[order.payment.method]}${order.payment.mpPaymentId ? `, pago MP #${order.payment.mpPaymentId}` : ""}).`, `Clienta: ${order.customer.name}, WhatsApp ${order.customer.whatsapp}${order.customer.email ? `, ${order.customer.email}` : ""}.`, "", summaryText(order), "", `Admin: ${adminUrl}`].join("\n"),
    html: layout({
      preheader: `Se acreditaron ${formatARS(order.total)} de ${order.customer.name}.`,
      eyebrow: "Pago acreditado",
      title: `Venta confirmada <span style="color:${C.green}">✓</span>`,
      intro: [
        `Se acreditaron <strong>${formatARS(order.total)}</strong> por ${esc(PAYMENT_LABEL[order.payment.method])} del pedido <strong>${esc(order.number)}</strong>. Ya podés hacerlo.`,
        `👤 <strong>${esc(order.customer.name)}</strong> · <a href="https://wa.me/${esc(order.customer.whatsapp)}" style="color:${C.bordo}">WhatsApp</a>`,
      ],
      order,
      cta: { href: adminUrl, label: "Abrir en el panel" },
    }),
  };
}
