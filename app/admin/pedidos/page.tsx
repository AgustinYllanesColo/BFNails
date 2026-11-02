import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listOrders } from "@/lib/data/orders";
import { cn } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";
import { OrderList } from "@/components/admin/OrderList";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requireAdmin();
  const { estado } = await searchParams;
  const status = estado && estado in ORDER_STATUS_LABEL ? (estado as OrderStatus) : undefined;
  const orders = await listOrders({ status });
  return (
    <>
      <PageTitle title="Pedidos">{orders.length} pedidos{status ? ` en "${ORDER_STATUS_LABEL[status]}"` : ""}.</PageTitle>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Link href="/admin/pedidos" className={cn("flex min-h-10 shrink-0 items-center rounded-pill px-4 text-sm font-semibold", !status ? "bg-bordo text-cream" : "bg-cream-deep")}>
          Todos
        </Link>
        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin/pedidos?estado=${s}`} className={cn("flex min-h-10 shrink-0 items-center rounded-pill px-4 text-sm font-semibold", status === s ? "bg-bordo text-cream" : "bg-cream-deep")}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <Card>
        <OrderList orders={orders} empty={status ? "No hay pedidos en este estado." : "Todavía no hay pedidos."} />
      </Card>
    </>
  );
}
