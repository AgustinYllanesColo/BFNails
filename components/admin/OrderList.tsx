import Link from "next/link";
import { formatARS } from "@/lib/format";
import { PAYMENT_LABEL, type Order } from "@/lib/types";
import { StatusBadge, tableClass } from "./ui";
import { IconChevron } from "./icons";

const when = (iso: string) => new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Pedidos: en el celular una tarjeta por pedido (se toca entera); en la compu, tabla. */
export function OrderList({ orders, empty = "Todavía no hay pedidos." }: { orders: Order[]; empty?: string }) {
  if (!orders.length) return <p className="py-6 text-center text-sm text-ink-soft">{empty}</p>;
  return (
    <>
      <ul className="divide-y divide-bordo/10 md:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{o.customer.name}</span>
                  <StatusBadge status={o.status} />
                </span>
                <span className="mt-0.5 block truncate text-sm text-ink-soft">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</span>
                <span className="mt-0.5 block text-xs text-ink-soft">
                  {o.number} · {when(o.createdAt)} · {o.delivery.label}
                </span>
              </span>
              <span className="shrink-0 text-right font-semibold tabular-nums">{formatARS(o.total)}</span>
              <IconChevron className="size-5 shrink-0 text-ink-soft" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className={tableClass}>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Clienta</th>
              <th>Qué pidió</th>
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
                  <div className="text-xs text-ink-soft">{when(o.createdAt)}</div>
                </td>
                <td>
                  {o.customer.name}
                  <div className="text-xs text-ink-soft">{o.customer.whatsapp}</div>
                </td>
                <td className="max-w-[260px] text-xs">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
                <td className="text-xs">{o.delivery.label}</td>
                <td className="text-xs">{PAYMENT_LABEL[o.payment.method]}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="text-right font-semibold tabular-nums">{formatARS(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
