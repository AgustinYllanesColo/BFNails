import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getAllMakeup } from "@/lib/data/content-repo";
import { MAKEUP_CATEGORIES, type MakeupProduct } from "@/lib/data/makeup";
import { formatARS } from "@/lib/format";
import { Card, PageTitle, adminBtn, tableClass } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";

const CATEGORY_LABEL = Object.fromEntries(MAKEUP_CATEGORIES.map((c) => [c.id, c.label])) as Record<string, string>;

/** Maquillaje en su propia sección del admin, como el catálogo de uñas: la lista, y cada producto se abre aparte. */
export default async function AdminMaquillajePage() {
  await requireAdmin();
  const all = await getAllMakeup();
  const combos = all.filter((m) => m.category === "combos");
  const loose = all.filter((m) => m.category !== "combos");
  return (
    <>
      <PageTitle
        title="Maquillaje"
        action={
          <Link href="/admin/maquillaje/nuevo" className={adminBtn}>
            + Nuevo producto
          </Link>
        }
      >
        {combos.length} combos y {loose.length} productos. Tocá uno para editarlo. {!hasDb() && "Sin base de datos no se guarda."}
      </PageTitle>
      <div className="space-y-6">
        <Card title="Combos">
          <MakeupTable products={combos} combo />
        </Card>
        <Card title="Productos">
          <MakeupTable products={loose} />
        </Card>
      </div>
    </>
  );
}

function MakeupTable({ products, combo }: { products: MakeupProduct[]; combo?: boolean }) {
  if (!products.length) return <p className="text-sm text-ink-soft">Todavía no hay ninguno.</p>;
  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr>
            <th></th>
            <th>{combo ? "Combo" : "Producto"}</th>
            {!combo && <th>Categoría</th>}
            <th>{combo ? "Trae" : "Stock"}</th>
            <th>Estado</th>
            <th className="text-right">Precio</th>
          </tr>
        </thead>
        <tbody>
          {products.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="relative size-12 overflow-hidden rounded-md bg-cream-deep">
                  {m.image ? <Image src={m.image} alt="" fill sizes="48px" className="object-cover" /> : <span className="absolute inset-0 grid place-items-center text-[10px] text-ink-soft">sin foto</span>}
                </div>
              </td>
              <td>
                <Link href={`/admin/maquillaje/${encodeURIComponent(m.id)}`} className="font-semibold text-bordo underline-offset-4 hover:underline">
                  {m.name}
                </Link>
                {m.brand && <div className="text-xs text-ink-soft">{m.brand}</div>}
              </td>
              {!combo && <td className="text-xs">{CATEGORY_LABEL[m.category]}</td>}
              <td className="text-xs tabular-nums">
                {combo ? `${m.includes?.length ?? 0} productos` : m.stock == null ? "sin control" : m.stock === 0 ? "agotado" : m.stock}
              </td>
              <td className="space-x-1 whitespace-nowrap">
                {m.featured && <Badge tone="yellow">★</Badge>}
                {m.video && <Badge tone="bordo">video</Badge>}
                {m.active ? <Badge tone="green">activo</Badge> : <Badge tone="red">oculto</Badge>}
              </td>
              <td className="text-right font-semibold tabular-nums">{formatARS(m.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
