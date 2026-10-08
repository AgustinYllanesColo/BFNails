import { NextResponse } from "next/server";
import { getPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import { getOrderByNumber, updateOrder } from "@/lib/data/orders";

/**
 * Webhook de Mercado Pago (evento "payment"). Valida la firma, consulta el pago
 * por id y actualiza la orden. Idempotente: si ya está pagada no hace nada.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    const ok = verifyWebhookSignature({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId,
      secret,
    });
    if (!ok) return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });

  try {
    const payment = await getPayment(dataId);
    const number = payment.external_reference;
    if (!number) return NextResponse.json({ ok: true, ignored: "sin external_reference" });
    const order = await getOrderByNumber(number);
    if (!order) return NextResponse.json({ ok: true, ignored: "orden no encontrada" });

    const status = payment.status;
    if (status === "approved" && order.status !== "pagado" && order.status !== "en_produccion" && order.status !== "listo" && order.status !== "enviado" && order.status !== "entregado") {
      await updateOrder(order.id, { status: "pagado", payment: { ...order.payment, mpPaymentId: String(payment.id) } });
    } else if ((status === "rejected" || status === "cancelled") && order.status === "pendiente_pago") {
      await updateOrder(order.id, { payment: { ...order.payment, mpPaymentId: String(payment.id) } });
    } else if (!order.payment.mpPaymentId) {
      await updateOrder(order.id, { payment: { ...order.payment, mpPaymentId: String(payment.id) } });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp webhook]", err);
    // 500 hace que MP reintente
    return NextResponse.json({ error: "error procesando" }, { status: 500 });
  }
}
