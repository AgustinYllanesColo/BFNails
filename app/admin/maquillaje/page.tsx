import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getAllMakeup } from "@/lib/data/content-repo";
import { MAKEUP_CATEGORIES, type MakeupProduct } from "@/lib/data/makeup";
import { Card, Notice, PageTitle, adminBtn } from "@/components/admin/ui";
import { QuickEditList, type QuickRow } from "@/components/admin/QuickEditList";
import { saveMakeupQuick } from "./actions";

const CATEGORY_LABEL = Object.fromEntries(MAKEUP_CATEGORIES.map((c) => [c.id, c.label])) as Record<string, string>;

function toRow(m: MakeupProduct, all: MakeupProduct[]): QuickRow {
  const combo = m.category === "combos";
  const parts = combo
    ? (m.includes ?? []).map((c) => all.find((x) => x.id === c.id)?.name).filter(Boolean).join(", ") || "Todavía no tiene productos"
    : [m.brand, CATEGORY_LABEL[m.category]].filter(Boolean).join(" · ");
  return {
    id: m.id,
    name: m.name,
    sub: parts,
    image: m.image,
    href: `/admin/maquillaje/${encodeURIComponent(m.id)}`,
    price: m.price,
    priceBefore: m.priceBefore,
    stock: combo ? undefined : m.stock,
    active: m.active,
    tags: [m.featured && "en la home", m.video && "video", m.stock === 0 && !combo && "agotado"].filter(Boolean) as string[],
  };
}

/** Maquillaje: los combos y los productos, con precio y stock editables en la misma lista; tocar uno abre todo lo demás. */
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
            + Nuevo producto o combo
          </Link>
        }
      >
        Cambiá precios y stock acá mismo y tocá Guardar cambios. Para fotos, video o textos, tocá el producto.
      </PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: los cambios no se guardan.</Notice>}
      <div className="space-y-6">
        <Card title={`Combos (${combos.length})`}>
          <QuickEditList rows={combos.map((m) => toRow(m, all))} action={saveMakeupQuick} empty="Todavía no hay combos. Creá uno con “Nuevo producto o combo” y elegí la categoría Combos." />
        </Card>
        <Card title={`Productos (${loose.length})`}>
          <QuickEditList rows={loose.map((m) => toRow(m, all))} action={saveMakeupQuick} stock />
        </Card>
      </div>
    </>
  );
}
