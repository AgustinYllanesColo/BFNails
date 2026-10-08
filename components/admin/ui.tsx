import { cn } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABEL } from "@/lib/types";

export function PageTitle({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {children && <p className="mt-1 text-sm text-ink-soft">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <section className={cn("rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10", className)}>
      {title && <h2 className="mb-4 font-display text-xl">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
      <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl text-bordo">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export const tableClass = "w-full text-sm [&_th]:p-2 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-bold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-ink-soft [&_td]:p-2 [&_td]:align-top [&_tr]:border-t [&_tr]:border-bordo/10";

const STATUS_TONE: Record<OrderStatus, "bordo" | "cream" | "yellow" | "ink" | "red" | "green"> = {
  a_confirmar: "yellow",
  pendiente_pago: "cream",
  pagado: "green",
  en_produccion: "bordo",
  listo: "bordo",
  enviado: "ink",
  entregado: "green",
  cancelado: "red",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export const adminInput =
  "h-10 w-full rounded-md border border-cream-ink bg-white px-3 text-sm focus:border-bordo focus:outline-none focus:ring-2 focus:ring-bordo/15";
export const adminBtn =
  "inline-flex h-10 items-center justify-center rounded-pill bg-bordo px-4 text-sm font-semibold text-cream hover:bg-bordo-soft disabled:opacity-50";
export const adminBtnGhost =
  "inline-flex h-10 items-center justify-center rounded-pill px-4 text-sm font-semibold text-bordo ring-2 ring-inset ring-bordo hover:bg-bordo hover:text-cream disabled:opacity-50";
