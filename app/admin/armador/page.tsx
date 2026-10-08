import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getBuilderConfig } from "@/lib/data/settings";
import { Card, PageTitle, adminBtn, adminInput, tableClass } from "@/components/admin/ui";
import { saveOptions } from "./actions";
import { listAllOptions } from "@/lib/admin/options";
import { formatARS } from "@/lib/format";

export default async function ArmadorAdminPage() {
  await requireAdmin();
  const c = await getBuilderConfig();
  type Row = { id: string; label: string; delta: number; complexity?: number; active?: boolean };
  let groups: Array<[string, Row[]]> = [
    ["Formas", c.shapes],
    ["Largos", c.lengths],
    ["Acabados", c.finishes],
    ["Colores base", c.bases],
    ["Técnicas y extras", c.extras],
  ];
  if (hasDb()) {
    // Con DB mostramos también las inactivas para poder reactivarlas.
    const all = await listAllOptions();
    const of = (kind: string) => all.filter((r) => r.kind === kind).map((r) => ({ id: r.id, label: r.label, delta: r.delta, complexity: r.complexity, active: r.active }));
    if (all.length) groups = [["Formas", of("shape")], ["Largos", of("length")], ["Acabados", of("finish")], ["Colores base", of("base")], ["Técnicas y extras", of("extra")]];
  }
  return (
    <>
      <PageTitle title="Armador">
        Precio base y cuánto suma cada opción. Los puntos de complejidad definen el nivel: {c.tiers.map((t) => `${t.label} ≥ ${t.minPoints} pts (+${formatARS(t.surcharge)})`).join(" · ")}.
        {!hasDb() && " Sin base de datos no se puede guardar."}
      </PageTitle>
      <form action={saveOptions} className="space-y-6">
        <Card>
          <label className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">Precio base del set (10 uñas + pegamento + lima)</span>
            <input name="basePrice" type="number" step={100} defaultValue={c.basePrice} className={adminInput + " w-40"} />
          </label>
        </Card>
        {groups.map(([title, opts]) => (
          <Card key={title} title={title}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Opción</th>
                  <th>Suma (ARS)</th>
                  <th>Puntos</th>
                  <th>Activa</th>
                </tr>
              </thead>
              <tbody>
                {opts.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <input type="hidden" name="id" value={o.id} />
                      <span className="font-semibold">{o.label}</span>
                      <span className="ml-2 text-xs text-ink-soft">{o.id}</span>
                    </td>
                    <td>
                      <input name={`delta:${o.id}`} type="number" step={100} defaultValue={o.delta} className={adminInput + " w-32"} />
                    </td>
                    <td>
                      <input name={`complexity:${o.id}`} type="number" min={0} max={10} defaultValue={o.complexity ?? 0} className={adminInput + " w-20"} />
                    </td>
                    <td>
                      <input type="checkbox" name={`active:${o.id}`} defaultChecked={o.active ?? true} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
        <button className={adminBtn} disabled={!hasDb()}>
          Guardar cambios
        </button>
      </form>
    </>
  );
}
