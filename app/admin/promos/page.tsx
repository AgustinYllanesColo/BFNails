import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getAllPromos } from "@/lib/data/content-repo";
import { Card, Notice, PageTitle } from "@/components/admin/ui";
import { PromoForm } from "@/components/admin/PromoForm";

export default async function AdminPromosPage() {
  await requireAdmin();
  const promos = await getAllPromos();
  return (
    <>
      <PageTitle title="Promos">Las tarjetas de promo de la home. Con fecha &quot;hasta&quot; se ocultan solas cuando vencen.</PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: los cambios no se guardan.</Notice>}
      <div className="space-y-6">
        <details className="group rounded-lg bg-white/80 ring-1 ring-bordo/10 open:p-5" open={promos.length === 0}>
          <summary className="flex min-h-14 cursor-pointer items-center px-5 font-title text-xl text-bordo group-open:mb-4 group-open:min-h-0 group-open:px-0">+ Nueva promo</summary>
          <PromoForm />
        </details>
        {promos.map((p) => (
          <Card key={p.id} title={p.title}>
            <PromoForm promo={p} />
          </Card>
        ))}
      </div>
    </>
  );
}
