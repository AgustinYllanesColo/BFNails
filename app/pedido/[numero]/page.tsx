import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByNumber, publicOrderUrl } from "@/lib/data/orders";
import { getSettings } from "@/lib/data/settings";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { formatARS, cn } from "@/lib/format";
import { describeItem, orderConfirmationMessage, waLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { Stars } from "@/components/motion/Stars";
import { CopyButton } from "@/components/ui/CopyButton";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

const FLOW: OrderStatus[] = ["pendiente_pago", "pagado", "en_produccion", "listo", "enviado", "entregado"];

type Props = { params: Promise<{ numero: string }>; searchParams: Promise<{ t?: string; pago?: string }> };

export default async function PedidoPage({ params, searchParams }: Props) {
  const { numero } = await params;
  const { t, pago } = await searchParams;
  const order = await getOrderByNumber(numero.toUpperCase());
  if (!order || !t || t !== order.token) notFound();
  const settings = await getSettings();
  const url = publicOrderUrl(order);
  const message = orderConfirmationMessage(order, url);
  const wa = waLink(message, settings.whatsapp);
  const stepIndex = Math.max(0, FLOW.indexOf(order.status));
  const isPaid = FLOW.indexOf(order.status) >= 1;

  return (
    <div className="relative overflow-hidden pt-28 pb-24 md:pt-36">
      <ClearCartOnMount />
      <Stars stars={[{ x: "88%", y: "6%", size: 120, rotate: 10, speed: 0.6 }, { x: "-3%", y: "40%", size: 90, rotate: -12, speed: 0.8, mobile: false }]} className="max-h-[700px]" />
      <div className="container-x relative max-w-3xl">
        <Eyebrow>Pedido {order.number}</Eyebrow>
        <h1 className="font-display text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.95]">
          {order.status === "a_confirmar" ? (
            <>
              Recibido, <span className="text-bordo">Bren lo cotiza</span>
            </>
          ) : isPaid ? (
            <>
              ¡Gracias, <span className="text-bordo">{order.customer.name.split(" ")[0]}</span>!
            </>
          ) : (
            <>
              Falta un <span className="text-bordo">paso</span>
            </>
          )}
        </h1>

        {pago === "error" && <p className="mt-4 rounded-md bg-red/10 p-3 text-sm text-red">El pago no se completó. Podés reintentar o elegir transferencia.</p>}
        {pago === "pendiente" && <p className="mt-4 rounded-md bg-yellow/30 p-3 text-sm">Mercado Pago está procesando tu pago. Te avisamos por WhatsApp cuando se acredite.</p>}

        {/* Estado */}
        <ol className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] font-bold tracking-wider uppercase md:grid-cols-6">
          {FLOW.map((s, i) => (
            <li key={s} className={cn("rounded-pill px-2 py-2", i <= stepIndex && order.status !== "a_confirmar" && order.status !== "cancelado" ? "bg-bordo text-cream" : "bg-cream-deep text-ink-soft")}>
              {ORDER_STATUS_LABEL[s]}
            </li>
          ))}
        </ol>
        {order.status === "cancelado" && <p className="mt-3 text-sm text-red">Este pedido fue cancelado.</p>}
        {order.tracking && (
          <p className="mt-4 text-sm">
            Seguimiento Correo Argentino: <strong>{order.tracking}</strong>
          </p>
        )}

        {/* Acción principal: WhatsApp */}
        <div className="mt-8 rounded-lg bg-bordo p-6 text-cream md:p-8">
          <h2 className="font-display text-2xl md:text-3xl">
            {order.status === "a_confirmar" ? "Mandale el pedido a Bren" : order.payment.method === "transferencia" && !isPaid ? "Transferí y confirmá por WhatsApp" : "Confirmá por WhatsApp"}
          </h2>
          {order.payment.method === "transferencia" && !isPaid && order.status !== "a_confirmar" && (
            <div className="mt-4 rounded-md bg-cream/10 p-4 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                Alias: <strong className="font-mono text-base">{settings.transferAlias}</strong>
                <CopyButton text={settings.transferAlias} />
              </p>
              <p className="mt-1">Titular: {settings.transferHolder}</p>
              <p className="mt-1">
                Monto: <strong>{formatARS(order.total)}</strong>
              </p>
            </div>
          )}
          <p className="mt-3 text-sm text-cream/85">
            El botón abre WhatsApp con el resumen de tu pedido ya escrito. {order.payment.method === "transferencia" && !isPaid ? "Adjuntá el comprobante y listo." : "Así Bren lo tiene a mano y arranca."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={wa} target="_blank" rel="noreferrer" variant="leopard" size="lg" data-cursor="wsp">
              Abrir WhatsApp
            </Button>
            {order.payment.method === "mercadopago" && !isPaid && order.payment.mpInitPoint && (
              <Button href={order.payment.mpInitPoint} variant="secondary" size="lg" className="ring-cream text-cream hover:bg-cream hover:text-bordo">
                Pagar con Mercado Pago
              </Button>
            )}
          </div>
        </div>

        {/* Detalle */}
        <div className="mt-8 rounded-lg bg-white/80 p-6 ring-1 ring-bordo/10">
          <h2 className="font-display text-2xl">Detalle</h2>
          <pre className="mt-3 font-sans text-sm whitespace-pre-wrap text-ink-soft">{order.items.map(describeItem).join("\n")}</pre>
          <dl className="mt-4 space-y-1 border-t border-bordo/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Entrega</dt>
              <dd>
                {order.delivery.label} · {order.delivery.cost ? formatARS(order.delivery.cost) : "gratis"}
              </dd>
            </div>
            {order.delivery.address?.street && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Dirección</dt>
                <dd className="text-right">
                  {[order.delivery.address.street, order.delivery.address.city, order.delivery.address.province, order.delivery.address.postalCode].filter(Boolean).join(", ")}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-soft">Pago</dt>
              <dd className="capitalize">{order.payment.method === "mercadopago" ? "Mercado Pago" : "Transferencia"}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>{order.needsConfirmation ? "Desde" : "Total"}</dt>
              <dd className="text-bordo">{formatARS(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-ink-soft">Guardá este link para ver el estado de tu pedido cuando quieras.</p>
        </div>
      </div>
    </div>
  );
}
