"use client";

import { useTransition } from "react";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/format";

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
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending || s === current}
          onClick={() => start(() => action(id, s))}
          className={cn(
            "rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
            s === current ? "bg-bordo text-cream" : s === "cancelado" ? "bg-red/10 text-red hover:bg-red hover:text-cream" : "bg-cream-deep hover:bg-bordo/15",
          )}
        >
          {labels[s]}
        </button>
      ))}
    </div>
  );
}
