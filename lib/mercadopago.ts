import "server-only";
import { createHmac } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import type { Order } from "@/lib/types";
import { siteConfig } from "@/lib/site";

export function mpEnabled() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

function client() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

/** Crea la preferencia de Checkout Pro para una orden y devuelve id + init_point. */
export async function createPreference(order: Order, orderUrl: string) {
  const pref = new Preference(client());
  const items = order.items.map((i) => ({
    id: i.kind === "design" ? i.designSlug : "custom",
    title: i.kind === "design" ? `${i.name} (press-on)` : "Set press-on a medida",
    quantity: i.qty,
    unit_price: i.unitPrice,
    currency_id: "ARS",
    category_id: "fashion",
  }));
  if (order.delivery.cost > 0) {
    items.push({ id: "envio", title: `Envío: ${order.delivery.label}`, quantity: 1, unit_price: order.delivery.cost, currency_id: "ARS", category_id: "services" });
  }
  const res = await pref.create({
    body: {
      items,
      external_reference: order.number,
      payer: {
        name: order.customer.name,
        email: order.customer.email || undefined,
        phone: { number: order.customer.whatsapp },
      },
      back_urls: {
        success: `${orderUrl}&pago=ok`,
        pending: `${orderUrl}&pago=pendiente`,
        failure: `${orderUrl}&pago=error`,
      },
      auto_return: "approved",
      notification_url: `${siteConfig.url}/api/webhooks/mercadopago`,
      statement_descriptor: "BF NAILS",
      metadata: { order_id: order.id, order_number: order.number },
    },
  });
  return { id: res.id as string, initPoint: (res.init_point ?? res.sandbox_init_point) as string };
}

export async function getPayment(paymentId: string) {
  return new Payment(client()).get({ id: paymentId });
}

/**
 * Valida la firma x-signature del webhook.
 * manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};" → HMAC-SHA256 con el secret.
 */
export function verifyWebhookSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = opts;
  if (!xSignature || !dataId) return false;
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, ...v] = p.split("=");
      return [k.trim(), v.join("=").trim()];
    }),
  ) as { ts?: string; v1?: string };
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};${xRequestId ? `request-id:${xRequestId};` : ""}ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === parts.v1;
}
