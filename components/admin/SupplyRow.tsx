"use client";

import { useState, useTransition } from "react";
import type { Supply } from "@/lib/admin/costs";
import { formatARS } from "@/lib/format";
import { Field, adminBtn, adminInput } from "./ui";
import { removeSupply, saveSupply } from "@/app/admin/insumos/actions";

/** Un insumo: se lee de un vistazo (pack, costo, costo por unidad) y se edita en el lugar. */
export function SupplyRow({ supply }: { supply: Supply }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  if (!editing) {
    return (
      <li className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
        <span className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <span className="block font-semibold">{supply.name}</span>
          <span className="block text-sm text-ink-soft">
            {supply.packQty} {supply.unit} a {formatARS(supply.packCost)}
            {supply.supplier && ` · ${supply.supplier}`}
          </span>
        </span>
        <span className="mr-auto font-semibold text-bordo tabular-nums sm:mr-0">
          {supply.unitCost.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 })} / {supply.unit}
        </span>
        <span className="flex gap-1">
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-pill px-3 text-sm font-semibold text-bordo hover:bg-bordo/10">
            Editar
          </button>
          <button type="button" disabled={pending} onClick={() => confirm(`¿Borrar "${supply.name}"?`) && start(() => removeSupply(supply.id))} className="min-h-11 rounded-pill px-3 text-sm font-semibold text-red hover:bg-red/10">
            Borrar
          </button>
        </span>
      </li>
    );
  }
  return (
    <li className="py-3">
      <form
        action={(fd) => {
          start(async () => {
            await saveSupply(fd);
            setEditing(false);
          });
        }}
        className="grid gap-3 rounded-md bg-cream-deep/40 p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.5fr]"
      >
        <input type="hidden" name="id" value={supply.id} />
        <Field label="Nombre">
          <input name="name" defaultValue={supply.name} className={adminInput} required />
        </Field>
        <Field label="Trae">
          <input name="packQty" type="number" inputMode="decimal" step="any" defaultValue={supply.packQty} className={adminInput} required />
        </Field>
        <Field label="Unidad">
          <input name="unit" defaultValue={supply.unit} className={adminInput} required />
        </Field>
        <Field label="Cuesta $">
          <input name="packCost" type="number" inputMode="numeric" defaultValue={supply.packCost} className={adminInput} required />
        </Field>
        <Field label="Dónde lo comprás">
          <input name="supplier" defaultValue={supply.supplier ?? ""} className={adminInput} />
        </Field>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button className={adminBtn} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="min-h-11 px-3 text-sm font-semibold underline underline-offset-4">
            Cancelar
          </button>
        </div>
      </form>
    </li>
  );
}
