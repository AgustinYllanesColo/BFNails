import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/data/orders";
import { formatARS } from "@/lib/format";
import { Card, PageTitle, Stat, adminBtn, adminBtnGhost } from "@/components/admin/ui";
import { OrderList } from "@/components/admin/OrderList";
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
  const pending = orders.filter((o) => o.status === "a_confirmar" || o.status === "pendiente_pago" || o.status === "pagado" || o.status === "en_produccion" || o.status === "listo").slice(0, 8);

  return (
    <>
      <PageTitle title="Inicio">Cómo viene el mes y lo que tenés pendiente.</PageTitle>
      <nav aria-label="Atajos" className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/pedidos" className={adminBtn}>Ver pedidos</Link>
        <Link href="/admin/catalogo" className={adminBtnGhost}>Precios de uñas</Link>
        <Link href="/admin/maquillaje" className={adminBtnGhost}>Precios y stock de maquillaje</Link>
        <Link href="/admin/promos" className={adminBtnGhost}>Promos</Link>
      </nav>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ventas del mes" value={formatARS(revenue)} hint={`${paid.length} pedidos pagos`} />
        <Stat label="Ticket promedio" value={formatARS(ticket)} />
        <Stat label="Pedidos del mes" value={String(thisMonth.length)} hint="incluye pendientes" />
        <Stat label="Para hacer" value={String(orders.filter((o) => o.status === "pagado" || o.status === "en_produccion").length)} hint="pagados y en producción" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Pedidos que necesitan algo tuyo">
          <OrderList orders={pending} empty="Nada pendiente." />
          {pending.length > 0 && (
            <Link href="/admin/pedidos" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-bordo">
              Ver todos los pedidos →
            </Link>
          )}
        </Card>
        <Card title="Por estado">
          <ul className="text-sm">
            {byStatus.map(([s, n]) => (
              <li key={s}>
                <Link href={`/admin/pedidos?estado=${s}`} className="flex min-h-10 items-center justify-between hover:underline">
                  {ORDER_STATUS_LABEL[s]}
                  <span className="font-semibold tabular-nums">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
