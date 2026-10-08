"use client";

import { useState, useTransition } from "react";
import type { Supply } from "@/lib/admin/costs";
import { formatARS } from "@/lib/format";
import { adminInput } from "./ui";
import { removeSupply, saveSupply } from "@/app/admin/insumos/actions";

export function SupplyRow({ supply }: { supply: Supply }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  if (!editing) {
    return (
      <tr>
        <td>
          <span className="font-semibold">{supply.name}</span>
          {supply.supplier && <div className="text-xs text-ink-soft">{supply.supplier}</div>}
        </td>
        <td>
          {supply.packQty} {supply.unit}
        </td>
        <td>{formatARS(supply.packCost)}</td>
        <td className="font-semibold text-bordo">
          {supply.unitCost.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 })} / {supply.unit}
        </td>
        <td className="space-x-2 text-right whitespace-nowrap">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-bordo underline">
            Editar
          </button>
          <button type="button" disabled={pending} onClick={() => confirm("¿Borrar insumo?") && start(() => removeSupply(supply.id))} className="text-xs font-semibold text-red underline">
            Borrar
          </button>
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td colSpan={5}>
        <form
          action={(fd) => {
            start(async () => {
              await saveSupply(fd);
              setEditing(false);
            });
          }}
          className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
        >
          <input type="hidden" name="id" value={supply.id} />
          <input name="name" defaultValue={supply.name} className={adminInput} required />
          <input name="packQty" type="number" step="any" defaultValue={supply.packQty} className={adminInput} required />
          <input name="unit" defaultValue={supply.unit} className={adminInput} required />
          <input name="packCost" type="number" defaultValue={supply.packCost} className={adminInput} required />
          <input name="supplier" defaultValue={supply.supplier ?? ""} placeholder="Proveedor" className={adminInput} />
          <div className="flex gap-2">
            <button className="rounded-pill bg-bordo px-3 text-xs font-semibold text-cream" disabled={pending}>
              OK
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs underline">
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
