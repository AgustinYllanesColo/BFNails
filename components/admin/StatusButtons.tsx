"use client";

import { useTransition } from "react";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/format";
import { adminBtn } from "./ui";

/** El paso que sigue a cada estado: es el botón grande. Los demás quedan en "Otro estado". */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pendiente_pago: "pagado",
  pagado: "en_produccion",
  en_produccion: "listo",
  listo: "enviado",
  enviado: "entregado",
};

export function StatusButtons({
  id,
  current,
  action,
  labels,
}: {
  id: string;
  current: OrderStatus;
  action: (id: string, status: OrderStatus) => Promise<void>;
  labels: Record<OrderStatus, string>;
}) {
  const [pending, start] = useTransition();
  const statuses = Object.keys(labels) as OrderStatus[];
  const next = NEXT[current];
  const go = (s: OrderStatus) => {
    if (s === "cancelado" && !confirm("¿Cancelar el pedido? El stock del maquillaje vuelve a estar disponible.")) return;
    start(() => action(id, s));
  };
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Ahora está en <b>{labels[current]}</b>.
      </p>
      {next && (
        <button type="button" disabled={pending} onClick={() => go(next)} className={cn(adminBtn, "w-full sm:w-auto")}>
          {pending ? "Guardando…" : `Marcar como ${labels[next].toLowerCase()}`}
        </button>
      )}
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-ink-soft">Otro estado</summary>
        <div className="flex flex-wrap gap-2 pt-1">
          {statuses
            .filter((s) => s !== current)
            .map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => go(s)}
                className={cn(
                  "min-h-11 rounded-pill px-4 text-sm font-semibold transition-colors duration-150 disabled:opacity-60",
                  s === "cancelado" ? "bg-red/10 text-red hover:bg-red hover:text-cream" : "bg-cream-deep hover:bg-bordo/15",
                )}
              >
                {labels[s]}
              </button>
            ))}
        </div>
      </details>
    </div>
  );
}
