import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getOrderById, publicOrderUrl } from "@/lib/data/orders";
import { formatARS } from "@/lib/format";
import { adminMessages, describeItem, waLink } from "@/lib/whatsapp";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL, type OrderStatus } from "@/lib/types";
import { Card, PageTitle, StatusBadge, adminBtn, adminBtnGhost, adminInput } from "@/components/admin/ui";
import { confirmPrice, setNotes, setOrderStatus, setTracking } from "../actions";
import { StatusButtons } from "@/components/admin/StatusButtons";

export default async function PedidoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  const url = publicOrderUrl(order);
  const payUrl = order.payment.mpInitPoint ?? url;

  const waButtons: Array<{ label: string; text: string; show: boolean }> = [
    { label: "Avisar precio confirmado", text: adminMessages.precioConfirmado(order, payUrl), show: order.status === "pendiente_pago" && !order.needsConfirmation },
    { label: "Avisar pago recibido", text: adminMessages.pagoRecibido(order), show: order.status === "pagado" },
    { label: "Avisar que está listo", text: adminMessages.listo(order), show: order.status === "listo" },
    { label: "Avisar envío + tracking", text: adminMessages.enviado(order), show: order.status === "enviado" },
    { label: "Mandar estado actual", text: adminMessages.estado(order), show: true },
  ];

  return (
    <>
      <PageTitle
        title={order.number}
        action={
          <a href={url} target="_blank" rel="noreferrer" className={adminBtnGhost}>
            Ver como la clienta ↗
          </a>
        }
      >
        {new Date(order.createdAt).toLocaleString("es-AR")} · <StatusBadge status={order.status} />
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Items">
            <pre className="font-sans text-sm whitespace-pre-wrap">{order.items.map(describeItem).join("\n\n")}</pre>
            <dl className="mt-4 space-y-1 border-t border-bordo/10 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatARS(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Envío · {order.delivery.label}</dt>
                <dd>{formatARS(order.delivery.cost)}</dd>
              </div>
              <div className="flex justify-between font-bold">
                <dt>Total</dt>
                <dd className="text-bordo">{formatARS(order.total)}</dd>
              </div>
            </dl>
            {order.items.some((i) => i.kind === "custom" && i.selection.referenceUrl) && (
              <p className="mt-3 text-sm">
                Referencias:{" "}
                {order.items
                  .filter((i) => i.kind === "custom" && i.selection.referenceUrl)
                  .map((i) => (i.kind === "custom" ? i.selection.referenceUrl : ""))
                  .map((u, k) => (
                    <a key={k} href={u} target="_blank" rel="noreferrer" className="text-bordo underline">
                      {u}
                    </a>
                  ))}
              </p>
            )}
          </Card>

          {order.status === "a_confirmar" && (
            <Card title="Confirmar precio final">
              <p className="mb-3 text-sm text-ink-soft">
                Este pedido tiene notas libres. Fijá el total (con envío incluido) y pasa a pendiente de pago. Si eligió Mercado Pago se genera el link.
              </p>
              <form action={confirmPrice.bind(null, order.id)} className="flex flex-wrap items-end gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-bold tracking-wider text-ink-soft uppercase">Total final</span>
                  <input name="total" type="number" defaultValue={order.total} min={0} step={100} className={adminInput + " w-40"} required />
                </label>
                <button className={adminBtn}>Confirmar y avisar</button>
              </form>
            </Card>
          )}

          <Card title="Estado">
            <StatusButtons id={order.id} current={order.status} action={setOrderStatus} labels={ORDER_STATUS_LABEL as Record<OrderStatus, string>} />
            <form action={setTracking.bind(null, order.id)} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-bold tracking-wider text-ink-soft uppercase">Tracking Correo Argentino</span>
                <input name="tracking" defaultValue={order.tracking ?? ""} className={adminInput + " w-64"} placeholder="Ej: AB123456789AR" />
              </label>
              <button className={adminBtnGhost}>Guardar</button>
            </form>
          </Card>

          <Card title="Notas internas">
            <form action={setNotes.bind(null, order.id)} className="space-y-3">
              <textarea name="notes" defaultValue={order.notes ?? ""} className={adminInput + " h-24 py-2"} />
              <button className={adminBtnGhost}>Guardar notas</button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Clienta">
            <p className="font-semibold">{order.customer.name}</p>
            <p className="text-sm text-ink-soft">{order.customer.whatsapp}</p>
            {order.customer.email && <p className="text-sm text-ink-soft">{order.customer.email}</p>}
            {order.delivery.address?.street && (
              <p className="mt-2 text-sm">
                {[order.delivery.address.street, order.delivery.address.city, order.delivery.address.province, order.delivery.address.postalCode].filter(Boolean).join(", ")}
                {order.delivery.address.notes && <span className="block text-xs text-ink-soft">{order.delivery.address.notes}</span>}
              </p>
            )}
            <a href={waLink(`Hola ${order.customer.name}! `, order.customer.whatsapp)} target="_blank" rel="noreferrer" className={adminBtn + " mt-4 w-full"}>
              Abrir WhatsApp
            </a>
          </Card>
          <Card title="Avisar por WhatsApp">
            <p className="mb-3 text-xs text-ink-soft">Cada botón abre el chat con el mensaje ya escrito.</p>
            <div className="grid gap-2">
              {waButtons
                .filter((b) => b.show)
                .map((b) => (
                  <a key={b.label} href={waLink(b.text, order.customer.whatsapp)} target="_blank" rel="noreferrer" className={adminBtnGhost + " justify-start"}>
                    {b.label}
                  </a>
                ))}
            </div>
          </Card>
          <Card title="Pago">
            <p className="text-sm">{PAYMENT_LABEL[order.payment.method]}</p>
            {order.payment.mpPaymentId && <p className="text-xs text-ink-soft">Pago MP #{order.payment.mpPaymentId}</p>}
            {order.payment.mpInitPoint && (
              <a href={order.payment.mpInitPoint} target="_blank" rel="noreferrer" className="text-xs text-bordo underline">
                Link de pago
              </a>
            )}
            <p className="mt-3 text-xs text-ink-soft">
              Link público: <Link href={url} className="underline">{url}</Link>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
