"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { Design } from "@/lib/types";
import { adminBtn, adminBtnGhost, adminInput } from "./ui";
import { saveDesign, removeDesign, type DesignFormState } from "@/app/admin/catalogo/actions";

export function DesignForm({ design }: { design?: Design }) {
  const [state, action, pending] = useActionState<DesignFormState, FormData>(saveDesign, undefined);
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4 rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
        {design && <input type="hidden" name="originalSlug" value={design.slug} />}
        <div className="grid gap-4 md:grid-cols-2">
          <L label="Nombre">
            <input name="name" required defaultValue={design?.name} className={adminInput} />
          </L>
          <L label="Slug (URL)">
            <input name="slug" defaultValue={design?.slug} placeholder="se genera del nombre" className={adminInput} />
          </L>
        </div>
        <L label="Descripción">
          <textarea name="description" defaultValue={design?.description} className={adminInput + " h-24 py-2"} />
        </L>
        <div className="grid gap-4 md:grid-cols-4">
          <L label="Forma">
            <select name="shape" defaultValue={design?.shape ?? "almendra"} className={adminInput}>
              {["almendra", "ovalada", "cuadrada", "coffin", "stiletto"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </L>
          <L label="Largo">
            <select name="length" defaultValue={design?.length ?? "medio"} className={adminInput}>
              {["corto", "medio", "largo", "xl"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </L>
          <L label="Acabado">
            <select name="finish" defaultValue={design?.finish ?? "glossy"} className={adminInput}>
              {["glossy", "mate", "cromado"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </L>
          <L label="Nivel (1–4)">
            <input name="complexity" type="number" min={1} max={4} defaultValue={design?.complexity ?? 1} className={adminInput} />
          </L>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <L label="Precio (ARS)">
            <input name="price" type="number" min={0} step={100} required defaultValue={design?.price} className={adminInput} />
          </L>
          <L label="Tags (coma)">
            <input name="tags" defaultValue={design?.tags.join(", ")} className={adminInput} placeholder="francesita, minimal" />
          </L>
          <L label="Colores hex (coma)">
            <input name="colors" defaultValue={design?.colors?.join(", ")} className={adminInput} placeholder="#e8c4b0, #ffffff" />
          </L>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={design?.featured} /> Destacado en la home
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked={design?.active ?? true} /> Visible en el catálogo
          </label>
          <label className="flex items-center gap-2">
            Orden <input name="sort" type="number" defaultValue={0} className={adminInput + " w-20"} />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
          <p className="mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">Fotos</p>
          {design?.images.length ? (
            <div className="mb-3 grid grid-cols-3 gap-2">
              {design.images.map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-md bg-cream-deep">
                  <Image src={src} alt="" fill sizes="100px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-xs text-ink-soft">Sin fotos: se muestra un placeholder con los colores.</p>
          )}
          <L label="URLs actuales (una por línea; borrá para quitar)">
            <textarea name="images" defaultValue={design?.images.join("\n")} className={adminInput + " h-20 py-2 text-xs"} />
          </L>
          <L label="Subir nuevas">
            <input type="file" name="newImages" accept="image/*" multiple className="text-sm" />
          </L>
          <p className="mt-2 text-[11px] text-ink-soft">Ideal: cuadradas, 1200×1200, buena luz. La primera es la portada.</p>
        </div>
        {state?.error && <p className="rounded bg-red/10 p-3 text-sm text-red">{state.error}</p>}
        <div className="flex flex-wrap gap-2">
          <button className={adminBtn} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
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

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</span>
      {children}
    </label>
  );
}
