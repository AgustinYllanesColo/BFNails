import Image from "next/image";
import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getKit } from "@/lib/data/content-repo";
import { IMAGE_TYPES } from "@/lib/admin/makeup-form";
import { Card, Notice, PageTitle, adminCheck, adminInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { saveKit } from "../contenido/actions";

/** Renglones vacíos al final para sumar cosas nuevas sin botones extra. */
const EMPTY_ROWS = 3;

export default async function AdminKitPage() {
  await requireAdmin();
  const kit = await getKit();
  const rows = [...kit.items, ...Array.from({ length: EMPTY_ROWS }, () => ({ name: "", detail: "" }))];
  return (
    <>
      <PageTitle title="Kit de colocación">Lo que va con cada set. Se muestra en la tienda, en &quot;Cómo funciona&quot;.</PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: los cambios no se guardan.</Notice>}
      <form action={saveKit} className="space-y-6">
        <Card title="Qué trae">
          <p className="mb-3 text-sm text-ink-soft">Una cosa por renglón. Para sacar una, borrá su nombre. Los renglones vacíos no se guardan.</p>
          <ol className="divide-y divide-bordo/10 sm:divide-y-0">
            {rows.map((it, i) => (
              <li key={i} className="grid gap-2 py-3 sm:grid-cols-[1fr_1fr] sm:py-1">
                <input name="itemName" defaultValue={it.name} placeholder={i < kit.items.length ? "" : "Nueva cosa (ej: lima)"} aria-label={`Cosa ${i + 1}`} className={adminInput} />
                <input name="itemDetail" defaultValue={"detail" in it ? (it.detail ?? "") : ""} placeholder="Detalle (opcional)" aria-label={`Detalle de la cosa ${i + 1}`} className={adminInput} />
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Fotos">
          {kit.images.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {kit.images.map((src) => (
                <div key={src}>
                  <span className="relative block aspect-square overflow-hidden rounded-md bg-cream-deep">
                    <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                  </span>
                  <label className={adminCheck}>
                    <input type="checkbox" name="removeImages" value={src} /> Quitar
                  </label>
                </div>
              ))}
            </div>
          )}
          <label className="rounded-pill inline-flex min-h-11 cursor-pointer items-center bg-white px-4 text-sm font-semibold ring-1 ring-bordo/20 has-[input:focus-visible]:ring-2">
            <input type="file" name="newImages" accept={IMAGE_TYPES.join(",")} multiple className="sr-only" />
            Sumar fotos
          </label>
        </Card>
        <SubmitButton>Guardar kit</SubmitButton>
      </form>
    </>
  );
}
