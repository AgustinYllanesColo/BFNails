import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/data/orders";
import { formatARS } from "@/lib/format";
import { Card, PageTitle, Stat, StatusBadge, tableClass } from "@/components/admin/ui";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export default async function AdminHome() {
  await requireAdmin();
  const orders = await listOrders({ limit: 500 });
  const now = new Date();
  const thisMonth = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const paidStatuses: OrderStatus[] = ["pagado", "en_produccion", "listo", "enviado", "entregado"];
  const paid = thisMonth.filter((o) => paidStatuses.includes(o.status));
  const revenue = paid.reduce((a, o) => a + o.total, 0);
  const ticket = paid.length ? revenue / paid.length : 0;
  const byStatus = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => [s, orders.filter((o) => o.status === s).length] as const);
  const pending = orders.filter((o) => o.status === "a_confirmar" || o.status === "pendiente_pago" || o.status === "pagado").slice(0, 8);

  return (
    <>
      <PageTitle title="Resumen">Cómo viene el mes.</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ventas del mes" value={formatARS(revenue)} hint={`${paid.length} pedidos pagos`} />
        <Stat label="Ticket promedio" value={formatARS(ticket)} />
        <Stat label="Pedidos del mes" value={String(thisMonth.length)} hint="incluye pendientes" />
        <Stat label="Por hacer" value={String(orders.filter((o) => o.status === "pagado" || o.status === "en_produccion").length)} hint="pagados y en producción" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Pedidos que necesitan acción">
          {pending.length === 0 ? (
            <p className="text-sm text-ink-soft">Nada pendiente. ✨</p>
          ) : (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Clienta</th>
                  <th>Estado</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-bordo underline-offset-4 hover:underline">
                        {o.number}
                      </Link>
                      <div className="text-xs text-ink-soft">{new Date(o.createdAt).toLocaleDateString("es-AR")}</div>
                    </td>
                    <td>{o.customer.name}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="text-right font-semibold">{formatARS(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Por estado">
          <ul className="space-y-2 text-sm">
            {byStatus.map(([s, n]) => (
              <li key={s} className="flex items-center justify-between">
                <Link href={`/admin/pedidos?estado=${s}`} className="hover:underline">
                  {ORDER_STATUS_LABEL[s]}
                </Link>
                <span className="font-semibold">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
