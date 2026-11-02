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
      {title && <h2 className="mb-4 font-title text-xl">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
      <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</p>
      <p className="mt-1 font-title text-3xl text-bordo">{value}</p>
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

/** Campos: 16 px en el celular (con menos, el iPhone hace zoom al tocarlos) y 44 px de alto para el dedo. */
export const adminInput =
  "h-11 w-full rounded-md border border-cream-ink bg-white px-3 text-base tabular-nums focus:border-bordo focus:outline-none focus:ring-2 focus:ring-bordo/15 md:h-10 md:text-sm";
export const adminBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill bg-bordo px-5 text-[15px] font-semibold text-cream transition-colors duration-150 hover:bg-bordo-soft active:scale-[0.98] disabled:opacity-50 md:min-h-10 md:text-sm";
export const adminBtnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-5 text-[15px] font-semibold text-bordo ring-2 ring-inset ring-bordo transition-colors duration-150 hover:bg-bordo hover:text-cream active:scale-[0.98] disabled:opacity-50 md:min-h-10 md:text-sm";
/** Casillero con su texto: toda la fila se toca. */
export const adminCheck = "flex min-h-11 items-center gap-2.5 text-[15px] md:min-h-9 md:text-sm [&_input]:size-5 [&_input]:accent-bordo";

/** Campo con etiqueta y, si hace falta, una ayuda corta debajo. */
export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

/** Aviso arriba de la página (guardado, error, atención). */
export function Notice({ tone = "ok", children }: { tone?: "ok" | "warn" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-4 rounded-md p-3 text-sm font-semibold ring-1",
        tone === "ok" && "bg-emerald-50 text-emerald-900 ring-emerald-700/30",
        tone === "warn" && "bg-yellow/30 text-ink ring-yellow/60",
        tone === "error" && "bg-red/10 text-red ring-red/30",
      )}
    >
      {children}
    </p>
  );
}
