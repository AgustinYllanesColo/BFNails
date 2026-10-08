import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/data/orders";
import { formatARS, cn } from "@/lib/format";
import { Card, PageTitle, StatusBadge, tableClass } from "@/components/admin/ui";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireAdmin();
  const { estado } = await searchParams;
  const status = estado && estado in ORDER_STATUS_LABEL ? (estado as OrderStatus) : undefined;
  const orders = await listOrders({ status });
  return (
    <>
      <PageTitle title="Pedidos">{orders.length} pedidos{status ? ` en "${ORDER_STATUS_LABEL[status]}"` : ""}.</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/pedidos" className={cn("rounded-pill px-3 py-1 text-xs font-semibold", !status ? "bg-bordo text-cream" : "bg-cream-deep")}>
          Todos
        </Link>
        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin/pedidos?estado=${s}`} className={cn("rounded-pill px-3 py-1 text-xs font-semibold", status === s ? "bg-bordo text-cream" : "bg-cream-deep")}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Clienta</th>
                <th>Items</th>
                <th>Entrega</th>
                <th>Pago</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-bordo underline-offset-4 hover:underline">
                      {o.number}
                    </Link>
                    <div className="text-xs text-ink-soft">{new Date(o.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</div>
                  </td>
                  <td>
                    {o.customer.name}
                    <div className="text-xs text-ink-soft">{o.customer.whatsapp}</div>
                  </td>
                  <td className="max-w-[260px] text-xs">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
                  <td className="text-xs">{o.delivery.label}</td>
                  <td className="text-xs capitalize">{o.payment.method === "mercadopago" ? "Mercado Pago" : "Transferencia"}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-right font-semibold">{formatARS(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-soft">
                    Sin pedidos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
