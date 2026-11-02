import type { Promo } from "@/lib/data/content";
import { IMAGE_TYPES } from "@/lib/admin/makeup-form";
import { deletePromo, savePromo } from "@/app/admin/contenido/actions";
import { PromoCard } from "@/components/sections/Promos";
import { Field, adminCheck, adminInput } from "./ui";
import { SubmitButton } from "./SubmitButton";

const THEMES = [
  ["rojo", "Rojo"],
  ["bordo", "Bordó"],
  ["rosa", "Rosa"],
  ["leopardo", "Negro y dorado"],
] as const;

/** A dónde lleva la tarjeta al tocarla: lugares de la tienda, sin escribir links. */
const DESTINATIONS = [
  ["", "WhatsApp (te escriben)"],
  ["/catalogo", "Catálogo de uñas"],
  ["/maquillaje", "Maquillaje"],
  ["/disena", "Armá tu set"],
  ["/dijes", "Dijes"],
] as const;

/** Una promo: lo que dice la tarjeta, precio, hasta cuándo y a dónde lleva. Al lado, cómo se ve. */
export function PromoForm({ promo }: { promo?: Promo }) {
  const custom = promo?.href && !DESTINATIONS.some(([v]) => v === promo.href) ? promo.href : undefined;
  return (
    <form action={savePromo} className="grid gap-5 lg:grid-cols-[1fr_300px]">
      {promo && <input type="hidden" name="id" value={promo.id} />}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[150px_1fr]">
          <Field label="Destacado" hint="Corto: -20%, 4x3, $13.000">
            <input name="badge" required maxLength={20} defaultValue={promo?.badge} placeholder="-20%" className={adminInput} />
          </Field>
          <Field label="Título">
            <input name="title" required minLength={2} maxLength={80} defaultValue={promo?.title} placeholder="Francesita de la semana" className={adminInput} />
          </Field>
        </div>
        <Field label="Texto corto" hint="Opcional.">
          <input name="text" maxLength={400} defaultValue={promo?.text} className={adminInput} />
        </Field>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field label="Precio promo">
            <input name="price" type="number" inputMode="numeric" min={0} step={1} defaultValue={promo?.price} className={adminInput} />
          </Field>
          <Field label="Precio antes">
            <input name="priceBefore" type="number" inputMode="numeric" min={0} step={1} defaultValue={promo?.priceBefore} className={adminInput} />
          </Field>
          <Field label="Hasta" hint="Se oculta sola.">
            <input name="until" type="date" defaultValue={promo?.until} className={adminInput} />
          </Field>
          <Field label="Color">
            <select name="theme" defaultValue={promo?.theme ?? "rojo"} className={adminInput}>
              {THEMES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Al tocarla, abre">
          <select name="href" defaultValue={promo?.href ?? ""} className={adminInput}>
            {DESTINATIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
            {custom && <option value={custom}>Otra página ({custom})</option>}
          </select>
        </Field>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <label className="rounded-pill inline-flex min-h-11 cursor-pointer items-center bg-white px-4 text-sm font-semibold ring-1 ring-bordo/20 has-[input:focus-visible]:ring-2">
            <input type="file" name="image" accept={IMAGE_TYPES.join(",")} className="sr-only" />
            {promo?.image ? "Cambiar foto" : "Subir foto"}
          </label>
          {promo?.image && (
            <label className={adminCheck}>
              <input type="checkbox" name="removeImage" /> Quitar foto
            </label>
          )}
          <label className={adminCheck}>
            <input type="checkbox" name="active" defaultChecked={promo?.active ?? true} /> Visible en la home
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <SubmitButton>{promo ? "Guardar" : "Agregar promo"}</SubmitButton>
          {promo && (
            <SubmitButton ghost formAction={deletePromo} confirmText={`¿Borrar la promo "${promo.title}"?`}>
              Borrar
            </SubmitButton>
          )}
        </div>
      </div>
      {promo && (
        <div aria-hidden className="pointer-events-none">
          <p className="mb-2 text-xs font-semibold text-ink-soft">Así se ve</p>
          <PromoCard promo={promo} />
        </div>
      )}
    </form>
  );
}
