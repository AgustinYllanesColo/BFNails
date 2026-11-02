import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { listSupplies } from "@/lib/admin/costs";
import { formatARS } from "@/lib/format";
import { Card, Field, Notice, PageTitle, adminInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { saveSupply } from "./actions";
import { SupplyRow } from "@/components/admin/SupplyRow";

export default async function InsumosPage() {
  await requireAdmin();
  const list = await listSupplies();
  return (
    <>
      <PageTitle title="Insumos">Lo que comprás para trabajar: cuánto trae el paquete y cuánto cuesta. Con eso se calcula el costo de cada set.</PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: no hay insumos para mostrar.</Notice>}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title={`Insumos (${list.length})`}>
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">Todavía no cargaste insumos. Empezá con el formulario.</p>
          ) : (
            <ul className="divide-y divide-bordo/10">
              {list.map((s) => (
                <SupplyRow key={s.id} supply={s} />
              ))}
            </ul>
          )}
        </Card>
        <Card title="Nuevo insumo">
          <form action={saveSupply} className="space-y-3">
            <Field label="Nombre">
              <input name="name" placeholder="Tips soft gel bolsa 500" required className={adminInput} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Trae">
                <input name="packQty" type="number" inputMode="decimal" step="any" min={0.001} placeholder="500" required className={adminInput} />
              </Field>
              <Field label="Unidad">
                <input name="unit" placeholder="u, g, ml" required className={adminInput} />
              </Field>
              <Field label="Cuesta $">
                <input name="packCost" type="number" inputMode="numeric" min={0} placeholder="9000" required className={adminInput} />
              </Field>
            </div>
            <Field label="Dónde lo comprás" hint="Opcional.">
              <input name="supplier" className={adminInput} />
            </Field>
            <Field label="Link de compra" hint="Opcional.">
              <input name="url" type="url" inputMode="url" className={adminInput} />
            </Field>
            <SubmitButton>Agregar insumo</SubmitButton>
            <p className="text-xs text-ink-soft">Ejemplo: trae 500 u y cuesta $9.000 → {formatARS(18)} cada tip.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
