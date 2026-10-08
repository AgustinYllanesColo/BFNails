import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { listSupplies } from "@/lib/admin/costs";
import { formatARS } from "@/lib/format";
import { Card, PageTitle, adminBtn, adminInput, tableClass } from "@/components/admin/ui";
import { saveSupply } from "./actions";
import { SupplyRow } from "@/components/admin/SupplyRow";

export default async function InsumosPage() {
  await requireAdmin();
  const list = await listSupplies();
  return (
    <>
      <PageTitle title="Insumos">
        Lo que comprás, cuánto trae el pack y cuánto cuesta. De acá sale el costo unitario que usan las recetas.
        {!hasDb() && " Sin base de datos no hay insumos."}
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Pack</th>
                  <th>Costo pack</th>
                  <th>Costo unitario</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <SupplyRow key={s.id} supply={s} />
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-soft">
                      Cargá el primer insumo con el formulario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Nuevo insumo">
          <form action={saveSupply} className="space-y-3 text-sm">
            <input name="name" placeholder="Nombre (ej: Tips soft gel bolsa 500)" required className={adminInput} />
            <div className="grid grid-cols-3 gap-2">
              <input name="packQty" type="number" step="any" min={0.001} placeholder="Cant." required className={adminInput} />
              <input name="unit" placeholder="u / g / ml" required className={adminInput} />
              <input name="packCost" type="number" min={0} placeholder="Costo $" required className={adminInput} />
            </div>
            <input name="supplier" placeholder="Proveedor (opcional)" className={adminInput} />
            <input name="url" placeholder="Link de compra (opcional)" className={adminInput} />
            <button className={adminBtn} disabled={!hasDb()}>
              Agregar
            </button>
            <p className="text-xs text-ink-soft">Ejemplo: 500 u · $9.000 → {formatARS(18)} por tip.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
