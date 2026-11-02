"use client";

import { useActionState, useState } from "react";
import type { Design } from "@/lib/types";
import { COMPLEXITY_LABEL } from "@/lib/data/catalog";
import { Field as L, adminBtn, adminBtnGhost, adminCheck, adminInput } from "./ui";
import { PhotoUploader } from "./PhotoUploader";
import { saveDesign, removeDesign, type DesignFormState } from "@/app/admin/catalogo/actions";

export function DesignForm({ design }: { design?: Design }) {
  const [state, action, pending] = useActionState<DesignFormState, FormData>(saveDesign, undefined);
  const [uploading, setUploading] = useState(false);
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4 rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
        {design && <input type="hidden" name="originalSlug" value={design.slug} />}
        {/* la dirección del diseño se arma sola con el nombre; al editar se conserva para no romper links */}
        {design && <input type="hidden" name="slug" value={design.slug} />}
        <L label="Nombre">
          <input name="name" required minLength={2} maxLength={80} defaultValue={design?.name} className={adminInput} />
        </L>
        <L label="Descripción">
          <textarea name="description" maxLength={4000} defaultValue={design?.description} className={adminInput.replace("h-11", "").replace("md:h-10", "") + " h-28 resize-y py-2"} />
        </L>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <L label="Forma">
            <select name="shape" defaultValue={design?.shape ?? "almendra"} className={adminInput}>
              {["almendra", "ovalada", "cuadrada", "coffin", "stiletto"].map((s) => (
                <option key={s} value={s}>
                  {s === "xl" ? "XL" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </L>
          <L label="Largo">
            <select name="length" defaultValue={design?.length ?? "medio"} className={adminInput}>
              {["corto", "medio", "largo", "xl"].map((s) => (
                <option key={s} value={s}>
                  {s === "xl" ? "XL" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </L>
          <L label="Acabado">
            <select name="finish" defaultValue={design?.finish ?? "glossy"} className={adminInput}>
              {["glossy", "mate", "cromado"].map((s) => (
                <option key={s} value={s}>
                  {s === "xl" ? "XL" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </L>
          <L label="Nivel">
            <select name="complexity" defaultValue={design?.complexity ?? 1} className={adminInput}>
              {([1, 2, 3, 4] as const).map((n) => (
                <option key={n} value={n}>
                  {COMPLEXITY_LABEL[n]}
                </option>
              ))}
            </select>
          </L>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <L label="Precio">
            <input name="price" type="number" inputMode="numeric" min={0} step={1} required defaultValue={design?.price} className={adminInput} />
          </L>
          <L label="Precio antes" hint="Se ve tachado. Vacío = sin oferta.">
            <input name="priceBefore" type="number" inputMode="numeric" min={0} step={1} defaultValue={design?.priceBefore ?? ""} className={adminInput} />
          </L>
        </div>
        <L label="Palabras para el filtro" hint={<>Separadas por coma. Poné <b>stock</b> si está para entrega inmediata y <b>talle M</b> (o el que sea) para decir en qué talle está.</>}>
          <input name="tags" defaultValue={design?.tags.join(", ")} className={adminInput} placeholder="francesita, minimal" />
        </L>
        <div className="flex flex-wrap gap-x-6">
          <label className={adminCheck}>
            <input type="checkbox" name="active" defaultChecked={design?.active ?? true} /> Visible en el catálogo
          </label>
          <label className={adminCheck}>
            <input type="checkbox" name="featured" defaultChecked={design?.featured} /> Destacado en la home
          </label>
        </div>
        <details className="rounded-md bg-cream-deep/40 px-3 py-2 text-sm">
          <summary className="min-h-9 cursor-pointer py-2 font-semibold text-ink-soft">Más opciones</summary>
          <div className="grid gap-4 pb-2 md:grid-cols-[1fr_120px]">
            <L label="Colores del diseño" hint="Códigos de color separados por coma (para el armador). Si no sabés, dejalo como está.">
              <input name="colors" defaultValue={design?.colors?.join(", ")} className={adminInput} placeholder="#e8c4b0, #ffffff" />
            </L>
            <L label="Orden" hint="Más bajo = más arriba.">
              <input name="sort" type="number" inputMode="numeric" defaultValue={design?.sort ?? 0} className={adminInput} />
            </L>
          </div>
        </details>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
          <p className="mb-2 text-sm font-semibold">Fotos</p>
          <PhotoUploader name="images" initial={design?.images ?? []} folder={design?.slug ?? "disenos"} onBusyChange={setUploading} />
          <p className="mt-2 text-xs text-ink-soft">Ideal: cuadradas, buena luz. La primera es la portada; con las flechas cambiás el orden.</p>
        </div>
        {state?.error && <p role="alert" className="rounded bg-red/10 p-3 text-sm text-red">{state.error}</p>}
        <div className="flex flex-wrap gap-2">
          <button className={adminBtn} disabled={pending || uploading}>
            {pending ? "Guardando…" : uploading ? "Subiendo fotos…" : "Guardar"}
          </button>
          {design && (
            <button type="button" className={adminBtnGhost + " ring-red text-red hover:bg-red"} onClick={() => confirm(`¿Borrar "${design.name}"?`) && removeDesign(design.slug)}>
              Borrar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
