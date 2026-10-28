import { NextResponse, after } from "next/server";
import { verifyWebhookSignature } from "@/lib/mercadopago";
import { reconcilePayment } from "@/lib/data/payments";
import { notifyOrderPaid } from "@/lib/data/notify";

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
    if (!ok) {
      console.warn("[mp webhook] firma inválida", { type, dataId });
      return NextResponse.json({ error: "firma inválida" }, { status: 401 });
    }
  }

  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });

  try {
    const res = await reconcilePayment(dataId);
    // venta confirmada: mail a la clienta (en marcha) y a Brenda, después de responderle a MP
    if (res.justPaid) {
      const paid = res.justPaid;
      after(() => notifyOrderPaid(paid));
    }
    return NextResponse.json({ ok: true, ignored: res.ignored });
  } catch (err) {
    console.error("[mp webhook]", err);
    // 500 hace que MP reintente
    return NextResponse.json({ error: "error procesando" }, { status: 500 });
  }
}
