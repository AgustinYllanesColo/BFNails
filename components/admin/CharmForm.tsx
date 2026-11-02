import Image from "next/image";
import { CHARM_CATEGORIES, type Charm } from "@/lib/data/content";
import { IMAGE_TYPES } from "@/lib/admin/makeup-form";
import { deleteCharm, saveCharm } from "@/app/admin/contenido/actions";
import { Card, Field, adminCheck, adminInput } from "./ui";
import { SubmitButton } from "./SubmitButton";

/** Un dije en su página: nombre, familia, precio, foto y si se ve. */
export function CharmForm({ charm }: { charm?: Charm }) {
  return (
    <form action={saveCharm} className="space-y-6">
      {charm && <input type="hidden" name="id" value={charm.id} />}
      <Card title="Datos">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_160px]">
          <Field label="Nombre">
            <input name="name" required minLength={2} maxLength={60} defaultValue={charm?.name} className={adminInput} />
          </Field>
          <Field label="Familia" hint="Para el filtro de la página de dijes.">
            <select name="category" defaultValue={charm?.category ?? ""} className={adminInput}>
              <option value="">Sin familia</option>
              {CHARM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Precio c/u">
            <input name="price" type="number" inputMode="numeric" min={0} step={1} required defaultValue={charm?.price} className={adminInput} />
          </Field>
        </div>
      </Card>
      <Card title="Foto">
        <div className="flex flex-wrap items-center gap-4">
          <span className="relative block size-24 shrink-0 overflow-hidden rounded-md bg-cream-deep">
            {charm?.image ? <Image src={charm.image} alt="" fill sizes="96px" className="object-cover" /> : <span className="absolute inset-0 grid place-items-center text-xs text-ink-soft">Sin foto</span>}
          </span>
          <label className="rounded-pill inline-flex min-h-11 cursor-pointer items-center bg-white px-4 text-sm font-semibold ring-1 ring-bordo/20 has-[input:focus-visible]:ring-2">
            <input type="file" name="image" accept={IMAGE_TYPES.join(",")} className="sr-only" />
            {charm?.image ? "Cambiar foto" : "Subir foto"}
          </label>
          {charm?.image && (
            <label className={adminCheck}>
              <input type="checkbox" name="removeImage" /> Quitar foto
            </label>
          )}
        </div>
      </Card>
      <label className={adminCheck}>
        <input type="checkbox" name="active" defaultChecked={charm?.active ?? true} /> Visible en la tienda y en el armador
      </label>
      <div className="flex flex-wrap gap-2">
        <SubmitButton>{charm ? "Guardar" : "Agregar dije"}</SubmitButton>
        {charm && (
          <SubmitButton ghost formAction={deleteCharm} confirmText={`¿Borrar "${charm.name}"? No se puede deshacer.`}>
            Borrar
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
