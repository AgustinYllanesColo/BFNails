import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getDesigns } from "@/lib/data/repo";
import { listAllDesigns } from "@/lib/admin/catalog";
import { designImage, COMPLEXITY_LABEL } from "@/lib/data/catalog";
import { formatARS } from "@/lib/format";
import { Card, PageTitle, adminBtn, tableClass } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import type { Design } from "@/lib/types";

export default async function AdminCatalogoPage() {
  await requireAdmin();
  const designs: Design[] = hasDb()
    ? (await listAllDesigns()).map((r) => ({ ...r, description: r.description ?? "", shape: r.shape as Design["shape"], length: r.length as Design["length"], finish: r.finish as Design["finish"], complexity: r.complexity as Design["complexity"] }))
    : await getDesigns();
  return (
    <>
      <PageTitle
        title="Catálogo"
        action={
          <Link href="/admin/catalogo/nuevo" className={adminBtn}>
            + Nuevo diseño
          </Link>
        }
      >
        {designs.length} diseños. {!hasDb() && "Sin base de datos se muestra el seed (solo lectura)."}
      </PageTitle>
      <Card>
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th></th>
                <th>Diseño</th>
                <th>Forma / largo</th>
                <th>Nivel</th>
                <th>Tags</th>
                <th>Estado</th>
                <th className="text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((d) => (
                <tr key={d.slug}>
                  <td>
                    <div className="relative size-12 overflow-hidden rounded-md bg-cream-deep">
                      <Image src={designImage(d, 0)} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  </td>
                  <td>
                    <Link href={`/admin/catalogo/${d.slug}`} className="font-semibold text-bordo underline-offset-4 hover:underline">
                      {d.name}
                    </Link>
                    <div className="text-xs text-ink-soft">/{d.slug}</div>
                  </td>
                  <td className="text-xs capitalize">
                    {d.shape} · {d.length} · {d.finish}
                  </td>
                  <td className="text-xs">{COMPLEXITY_LABEL[d.complexity]}</td>
                  <td className="text-xs">{d.tags.join(", ")}</td>
                  <td className="space-x-1">
                    {d.featured && <Badge tone="yellow">★</Badge>}
                    {d.active === false ? <Badge tone="red">oculto</Badge> : <Badge tone="green">activo</Badge>}
                  </td>
                  <td className="text-right font-semibold">{formatARS(d.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
