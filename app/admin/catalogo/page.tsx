import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getDesigns } from "@/lib/data/repo";
import { listAllDesigns } from "@/lib/admin/catalog";
import { designImage, COMPLEXITY_LABEL } from "@/lib/data/catalog";
import { Card, Notice, PageTitle, adminBtn } from "@/components/admin/ui";
import { QuickEditList } from "@/components/admin/QuickEditList";
import type { Design } from "@/lib/types";
import { saveDesignsQuick } from "./actions";

/** Uñas: los diseños con precio editable en la misma lista; tocar uno abre fotos y textos. */
export default async function AdminCatalogoPage() {
  await requireAdmin();
  const designs: Design[] = hasDb()
    ? (await listAllDesigns()).map((r) => ({ ...r, description: r.description ?? "", shape: r.shape as Design["shape"], length: r.length as Design["length"], finish: r.finish as Design["finish"], complexity: r.complexity as Design["complexity"], priceBefore: r.priceBefore ?? undefined }))
    : await getDesigns();
  return (
    <>
      <PageTitle
        title="Uñas"
        action={
          <Link href="/admin/catalogo/nuevo" className={adminBtn}>
            + Nuevo diseño
          </Link>
        }
      >
        Cambiá precios acá mismo y tocá Guardar cambios. Para fotos o textos, tocá el diseño.
      </PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: se muestran los diseños de ejemplo y no se guardan cambios.</Notice>}
      <Card title={`Diseños (${designs.length})`}>
        <QuickEditList
          action={saveDesignsQuick}
          rows={designs.map((d) => ({
            id: d.slug,
            name: d.name,
            sub: `${cap(d.shape)} · ${d.length === "xl" ? "XL" : d.length} · ${COMPLEXITY_LABEL[d.complexity]}`,
            image: designImage(d, 0),
            href: `/admin/catalogo/${d.slug}`,
            price: d.price,
            priceBefore: d.priceBefore,
            active: d.active !== false,
            tags: [d.featured && "en la home", d.tags.includes("stock") && "en stock"].filter(Boolean) as string[],
          }))}
        />
      </Card>
    </>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
