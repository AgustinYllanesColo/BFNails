import { NextResponse, after } from "next/server";
import { checkoutSchema, normalizeWhatsapp } from "@/lib/checkout";
import { getDesign } from "@/lib/data/repo";
import { getBuilderConfig, getSettings } from "@/lib/data/settings";
import { quoteSelection, designVariantPrice, fourForThree } from "@/lib/pricing";
import { quoteFromTable } from "@/lib/shipping/table";
import { quoteShipping } from "@/lib/shipping";
import {
  createOrder,
  newToken,
  ordersEnabled,
  publicOrderUrl,
  updateOrder,
  type NewOrder,
} from "@/lib/data/orders";
import { createPreference, mpEnabled } from "@/lib/mercadopago";
import { notifyOrderCreated } from "@/lib/data/notify";
import { designImage } from "@/lib/data/catalog";
import { getLivePromos } from "@/lib/data/content-repo";
import { fourForThreeLive } from "@/lib/data/content";
import { mpSurcharge, type CartItem } from "@/lib/types";

/**
 * Crea la orden. Los precios se recalculan en el servidor (nunca se confía en el
 * carrito del cliente). Si el pago es Mercado Pago, crea la preferencia y devuelve
 * init_point; si es transferencia, devuelve la URL pública del pedido.
 */
export async function POST(req: Request) {
  if (!ordersEnabled()) {
    return NextResponse.json(
      { error: "Todavía no tomo pedidos por la web. Escribime por WhatsApp." },
      { status: 503 },
    );
  }
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisá los datos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const [config, settings, promos] = await Promise.all([getBuilderConfig(), getSettings(), getLivePromos()]);

  // 1. Items con precio de servidor (ref = id del ítem en el carrito, para devolverle precios nuevos si cambiaron)
  const items: CartItem[] = [];
  const refs = new Map<string, string>();
  let needsConfirmation = false;
  for (const it of input.items) {
    if (it.kind === "design") {
      const d = await getDesign(it.designSlug);
      if (!d || d.active === false)
        return NextResponse.json(
          { error: `El diseño ${it.designSlug} ya no está disponible` },
          { status: 400 },
        );
      items.push({
        id: crypto.randomUUID(),
        kind: "design",
        designSlug: d.slug,
        name: d.name,
        image: designImage(d, 0),
        unitPrice: designVariantPrice(d, it.shape, it.length, config, it.sizes),
        qty: it.qty,
        sizes: it.sizes,
        shape: it.shape ?? d.shape,
        length: it.length ?? d.length,
      });
    } else if (it.kind === "charm") {
      const charm = config.charms?.find((c) => c.id === it.charmId && c.active);
      if (!charm)
        return NextResponse.json({ error: `El dije ${it.charmId} ya no está disponible` }, { status: 400 });
      items.push({
        id: crypto.randomUUID(),
        kind: "charm",
        charmId: charm.id,
        name: charm.name,
        image: charm.image,
        unitPrice: charm.price,
        qty: it.qty,
      });
    } else {
      const quote = quoteSelection(it.selection, config);
      needsConfirmation ||= quote.needsConfirmation;
      items.push({
        id: crypto.randomUUID(),
        kind: "custom",
        name: "Set a medida",
        selection: it.selection,
        quote,
        unitPrice: quote.total,
        qty: it.qty,
        sizes: it.sizes,
      });
    }
  }
  input.items.forEach((it, n) => it.ref && items[n] && refs.set(items[n].id, it.ref));
  const repriced = Object.fromEntries(items.flatMap((i) => (refs.has(i.id) ? [[refs.get(i.id)!, i.unitPrice]] : [])));

  // 4x3: de cada 4 sets del catálogo, el más barato va de regalo. Las unidades gratis quedan como una fila aparte a $0,
  // así Brenda ve qué tiene que hacer y el pedido, los mails y Mercado Pago cierran solos.
  if (fourForThreeLive(promos)) {
    const { free } = fourForThree(items.map((i) => ({ key: i.id, kind: i.kind, unitPrice: i.unitPrice, qty: i.qty })));
    for (const [id, n] of free) {
      const i = items.findIndex((x) => x.id === id);
      const it = items[i];
      if (it.kind !== "design") continue;
      items.push({ ...it, id: crypto.randomUUID(), name: `${it.name} (regalo 4x3)`, unitPrice: 0, qty: n });
      if (it.qty === n) items.splice(i, 1);
      else items[i] = { ...it, qty: it.qty - n };
    }
  }
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);

  // 2. Envío con precio de servidor
  const postalCode = input.delivery.address?.postalCode;
  const options = input.delivery.method.startsWith("correo")
    ? await quoteShipping({ postalCode })
    : quoteFromTable(settings.shipping);
  const chosen = options.find((o) => o.method === input.delivery.method);
  if (!chosen)
    return NextResponse.json(
      { error: "Esa forma de entrega no está disponible para tu código postal" },
      { status: 400 },
    );
  if (
    input.delivery.method.startsWith("correo") &&
    !(input.delivery.address?.street && input.delivery.address?.city && postalCode)
  ) {
    return NextResponse.json(
      { error: "Faltan dirección, localidad y código postal para el envío" },
      { status: 400 },
    );
  }
  if (input.delivery.method === "moto" && !input.delivery.address?.street) {
    return NextResponse.json({ error: "Falta tu dirección para la moto" }, { status: 400 });
  }

  if (
    input.payment.method === "efectivo" &&
    !(chosen.method === "retiro" || chosen.method === "moto")
  ) {
    return NextResponse.json(
      { error: "El pago en efectivo es solo para retiro en estación o moto" },
      { status: 400 },
    );
  }
  // La moto tiene precio "desde": Brenda confirma el costo final por WhatsApp antes del pago.
  if (chosen.from) needsConfirmation = true;

  const useMp = input.payment.method === "mercadopago" && mpEnabled() && !needsConfirmation;
  // Con precio a confirmar, el recargo se suma cuando Brenda fija el total final.
  const surcharge = input.payment.method === "mercadopago" && !needsConfirmation ? mpSurcharge(subtotal + chosen.cost) : 0;
  const total = subtotal + chosen.cost + surcharge;
  if (input.expectedTotal != null && total > input.expectedTotal) {
    return NextResponse.json(
      { error: `Se actualizó un precio: el total ahora es ${total.toLocaleString("es-AR")}. Revisalo y confirmá de nuevo.`, repriced, total },
      { status: 409 },
    );
  }

  const draft: NewOrder = {
    token: newToken(),
    status: needsConfirmation ? "a_confirmar" : "pendiente_pago",
    customer: {
      name: input.customer.name,
      whatsapp: normalizeWhatsapp(input.customer.whatsapp),
      email: input.customer.email || undefined,
    },
    items,
    subtotal,
    delivery: {
      method: chosen.method,
      cost: chosen.cost,
      label: chosen.from ? `${chosen.label} (desde)` : chosen.label,
      address: input.delivery.address,
    },
    payment: { method: input.payment.method },
    total,
    needsConfirmation,
  };

  let order = await createOrder(draft);
  const url = publicOrderUrl(order);
  // Mail con el número de pedido a la clienta y aviso a Brenda, después de responder: un mail lento no puede trabar la
  // compra (la clienta reintentaba y quedaban pedidos repetidos). Si falla, el pedido sigue igual.
  after(() => notifyOrderCreated(order));

  if (useMp) {
    try {
      const pref = await createPreference(order, url);
      order =
        (await updateOrder(order.id, {
          payment: { ...order.payment, mpPreferenceId: pref.id, mpInitPoint: pref.initPoint },
        })) ?? order;
      return NextResponse.json({ orderNumber: order.number, url, redirect: pref.initPoint });
    } catch (err) {
      console.error("[checkout] Mercado Pago falló", err);
      // La orden existe; la clienta puede pagar desde la página del pedido o por transferencia.
      return NextResponse.json({
        orderNumber: order.number,
        url,
        redirect: url,
        warning: "mp_failed",
      });
    }
  }

  return NextResponse.json({ orderNumber: order.number, url, redirect: url });
}
