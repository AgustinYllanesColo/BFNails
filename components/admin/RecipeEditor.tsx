"use client";

import { useMemo, useState, useTransition } from "react";
import type { Recipe, Supply } from "@/lib/admin/costs";
import { adminBtn, adminInput } from "./ui";
import { removeRecipe, saveRecipe } from "@/app/admin/costos/actions";
import { formatARS } from "@/lib/format";

export function RecipeEditor({ supplies, recipes, targets, dbReady }: { supplies: Supply[]; recipes: Recipe[]; targets: Array<{ target: string; label: string }>; dbReady: boolean }) {
  const [target, setTarget] = useState(targets[0]?.target ?? "base");
  const [pending, start] = useTransition();
  const current = useMemo(() => recipes.find((r) => r.target === target), [recipes, target]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [minutes, setMinutes] = useState<number | null>(null);

  // Al cambiar de target, reseteamos valores locales
  const effQty = (id: string) => qty[`${target}:${id}`] ?? current?.usages.find((u) => u.supplyId === id)?.qty ?? 0;
  const effMinutes = minutes ?? current?.minutes ?? 0;
  const materials = supplies.reduce((a, s) => a + s.unitCost * effQty(s.id), 0);

  return (
    <section className="rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
      <h2 className="mb-3 font-display text-xl">Receta de costo</h2>
      <form action={(fd) => start(() => saveRecipe(fd))} className="space-y-3 text-sm">
        <select
          name="target"
          value={target}
          onChange={(e) => {
            setTarget(e.target.value);
            setMinutes(null);
          }}
          className={adminInput}
        >
          {targets.map((t) => (
            <option key={t.target} value={t.target}>
              {t.label}
            </option>
          ))}
        </select>
        <input type="hidden" name="label" value={targets.find((t) => t.target === target)?.label ?? target} />
        <label className="flex items-center justify-between gap-3">
          <span>Minutos de trabajo</span>
          <input name="minutes" type="number" min={0} value={effMinutes} onChange={(e) => setMinutes(Number(e.target.value))} className={adminInput + " w-24"} />
        </label>
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md bg-cream-deep/60 p-2">
          {supplies.length === 0 && <p className="p-2 text-xs text-ink-soft">Primero cargá insumos.</p>}
          {supplies.map((s) => (
            <label key={s.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-white">
              <input type="hidden" name="supplyId" value={s.id} />
              <span className="min-w-0 flex-1 truncate">
                {s.name} <span className="text-[11px] text-ink-soft">({formatARS(s.unitCost)}/{s.unit})</span>
              </span>
              <input
                name={`qty:${s.id}`}
                type="number"
                step="any"
                min={0}
                value={effQty(s.id) || ""}
                placeholder="0"
                onChange={(e) => setQty({ ...qty, [`${target}:${s.id}`]: Number(e.target.value) })}
                className={adminInput + " h-8 w-20 text-right"}
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-ink-soft">Insumos: {formatARS(materials)} por kit.</p>
        <div className="flex gap-2">
          <button className={adminBtn} disabled={pending || !dbReady}>
            Guardar receta
          </button>
          {current && (
            <button type="button" className="text-xs text-red underline" onClick={() => confirm("¿Borrar receta?") && start(() => removeRecipe(target))}>
              Borrar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
