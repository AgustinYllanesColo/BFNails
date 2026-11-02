import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getAllCharms } from "@/lib/data/content-repo";
import { CHARM_CATEGORIES } from "@/lib/data/content";
import { Card, Notice, PageTitle, adminBtn } from "@/components/admin/ui";
import { QuickEditList } from "@/components/admin/QuickEditList";
import { saveCharmsQuick } from "../contenido/actions";

const FAMILY = Object.fromEntries(CHARM_CATEGORIES.map((c) => [c.id, c.label])) as Record<string, string>;

export default async function AdminDijesPage() {
  await requireAdmin();
  const charms = await getAllCharms();
  return (
    <>
      <PageTitle
        title="Dijes"
        action={
          <Link href="/admin/dijes/nuevo" className={adminBtn}>
            + Nuevo dije
          </Link>
        }
      >
        Precio por unidad. Cambialo acá y tocá Guardar cambios. Para la foto o el nombre, tocá el dije.
      </PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: los cambios no se guardan.</Notice>}
      <Card title={`Dijes (${charms.length})`}>
        <QuickEditList
          before={false}
          action={saveCharmsQuick}
          rows={charms.map((c) => ({ id: c.id, name: c.name, sub: c.category ? FAMILY[c.category] : undefined, image: c.image, href: `/admin/dijes/${encodeURIComponent(c.id)}`, price: c.price, active: c.active }))}
        />
      </Card>
    </>
  );
}
