"use client";

import { useState } from "react";
import Image from "next/image";
import { MAKEUP_CATEGORIES, type MakeupCategory, type MakeupProduct } from "@/lib/data/makeup";
import { IMAGE_TYPES, MAKEUP_LIMITS } from "@/lib/admin/makeup-form";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { Card, Field as L, adminCheck, adminInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { deleteMakeup, saveMakeup } from "@/app/admin/maquillaje/actions";

/**
 * Producto de maquillaje (o combo) en su propia página del admin, como un diseño del catálogo de uñas.
 * Con la categoría "Combos" aparece qué trae y desaparece el stock: el combo no tiene stock propio (ver CLAUDE.md).
 * Forma y color no se piden: solo eran para el dibujo provisorio y van fotos.
 */
export function MakeupForm({ product, loose }: { product?: MakeupProduct; loose: MakeupProduct[] }) {
  const [category, setCategory] = useState<MakeupCategory>(product?.category ?? "labios");
  const isCombo = category === "combos";

  return (
    <form action={saveMakeup} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Card title="Datos">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_200px]">
          <L label="Nombre">
            <input name="name" required minLength={2} maxLength={MAKEUP_LIMITS.name} defaultValue={product?.name} className={adminInput} />
          </L>
          <L label="Marca">
            <input name="brand" maxLength={MAKEUP_LIMITS.brand} defaultValue={product?.brand} className={adminInput} />
          </L>
          <L label="Categoría">
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value as MakeupCategory)} className={adminInput}>
              {MAKEUP_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </L>
        </div>
        <div className="mt-4 space-y-4">
          <L label="Descripción" hint={isCombo ? "Qué trae, en una línea: es lo que lee la clienta." : "Una línea."}>
            <input name="description" maxLength={MAKEUP_LIMITS.description} defaultValue={product?.description} className={adminInput} />
          </L>
          {!isCombo && (
            <L label="Tonos disponibles" hint="Separados por coma. Vacío = sin tonos. Si hay, la clienta elige uno.">
              <input name="shades" maxLength={400} placeholder="02, 04, 06" defaultValue={product?.shades?.join(", ")} className={adminInput} />
            </L>
          )}
        </div>
      </Card>

      <Card title="Precio y stock">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <L label={isCombo ? "Precio del combo" : "Precio c/u"}>
            <input name="price" type="number" min={0} max={MAKEUP_LIMITS.price} step={1} required defaultValue={product?.price} className={adminInput} />
          </L>
          <L label="Precio antes" hint="Opcional: se ve tachado.">
            <input name="priceBefore" type="number" min={0} max={MAKEUP_LIMITS.price} step={1} defaultValue={product?.priceBefore} className={adminInput} />
          </L>
          {!isCombo && (
            <L label="Stock" hint="Vacío = sin control. 0 = agotado.">
              <input name="stock" type="number" min={0} max={MAKEUP_LIMITS.stock} step={1} defaultValue={product?.stock} className={adminInput} />
            </L>
          )}
        </div>
        {isCombo && (
          <p className="mt-3 text-sm text-ink-soft">
            El combo no tiene stock propio: armarlo no descuenta nada. Solo si se vende el combo se descuenta lo que trae, y
            se ve agotado cuando algo de adentro se termina.
          </p>
        )}
      </Card>

      {isCombo && <ComboIncludes product={product} loose={loose} />}

      <Card title="Foto y video">
        <div className="flex flex-wrap items-start gap-4">
          <span className="relative block size-24 shrink-0 overflow-hidden rounded-md bg-cream-deep">
            {product?.image ? (
              <Image src={product.image} alt="" fill sizes="96px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-xs text-ink-soft">Sin foto</span>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="rounded-pill inline-flex cursor-pointer items-center gap-1.5 bg-white px-3 py-2 font-semibold ring-1 ring-bordo/20 has-[input:focus-visible]:ring-2">
              <input type="file" name="image" accept={IMAGE_TYPES.join(",")} className="sr-only" />
              {product?.image ? "Cambiar foto" : "Subir foto"}
            </label>
            {product?.image && (
              <label className="flex items-center gap-1">
                <input type="checkbox" name="removeImage" /> quitar foto
              </label>
            )}
          </div>
        </div>
        <div className="mt-4">
          <VideoUploader initial={product?.video} hasImage={Boolean(product?.image)} />
        </div>
      </Card>

      <Card title="Dónde se ve">
        <div className="flex flex-wrap gap-x-6">
          <label className={adminCheck}>
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Disponible en la tienda
          </label>
          <label className={adminCheck}>
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Destacado en la home
          </label>
          <label className={adminCheck}>
            <input type="checkbox" name="isNew" defaultChecked={product?.isNew ?? true} /> Etiqueta &quot;Nuevo&quot;
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <SubmitButton>{product ? "Guardar" : "Agregar"}</SubmitButton>
        {product && (
          <SubmitButton ghost formAction={deleteMakeup} confirmText={`¿Borrar "${product.name}"? No se puede deshacer.`}>
            Borrar
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

/** Qué trae el combo: la cantidad de cada producto suelto (vacío o 0 = no lo trae). */
function ComboIncludes({ product, loose }: { product?: MakeupProduct; loose: MakeupProduct[] }) {
  const qty = (id: string) => product?.includes?.find((c) => c.id === id)?.qty;
  return (
    <Card title="Qué trae el combo">
      <p className="mb-3 text-sm text-ink-soft">Poné cuántos lleva de cada producto. Los que quedan vacíos no van en el combo.</p>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {loose.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-sm">
            <span className="w-16 shrink-0">
              <input
                name={`inc_${m.id}`}
                type="number"
                min={0}
                max={20}
                step={1}
                defaultValue={qty(m.id)}
                aria-label={`Cantidad de ${m.name}${m.brand ? ` ${m.brand}` : ""}`}
                className={adminInput + " px-2 py-1 text-center"}
              />
            </span>
            <span className="min-w-0 leading-tight [overflow-wrap:anywhere]">
              {m.name}
              {m.brand && <span className="text-ink-soft"> · {m.brand}</span>}
              {m.shades && <span className="text-ink-soft"> · tonos {m.shades.join(", ")}</span>}
              {!m.active && <span className="text-ink-soft"> (no disponible)</span>}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
