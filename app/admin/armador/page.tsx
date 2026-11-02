import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getBuilderConfig } from "@/lib/data/settings";
import { Card, Notice, PageTitle, adminInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { saveOptions } from "./actions";
import { listAllOptions } from "@/lib/admin/options";
import { formatARS } from "@/lib/format";
import { DEFAULT_BUILDER_CONFIG, UNIT_LABEL } from "@/lib/pricing";

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
      <PageTitle title="Precios del armador">Lo que cobra el armador de la tienda: el precio base del set y cuánto suma cada opción que elige la clienta.</PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: los cambios no se guardan.</Notice>}
      <form action={saveOptions} className="space-y-6">
        <Card>
          <label className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">Precio base del set</span>
            <span className="text-sm text-ink-soft">10 uñas + pegamento + lima</span>
            <input name="basePrice" type="number" inputMode="numeric" min={0} step={1} defaultValue={c.basePrice} className={adminInput + " w-40"} />
          </label>
        </Card>
        <details className="rounded-lg bg-white/60 p-4 text-sm ring-1 ring-bordo/10">
          <summary className="min-h-9 cursor-pointer font-semibold">¿Qué es la dificultad?</summary>
          <p className="mt-2 text-ink-soft">
            Cada opción suma puntos de dificultad. Según el total, el set cae en un nivel que tiene su recargo:{" "}
            {c.tiers.map((t) => `${t.label} desde ${t.minPoints} (+${formatARS(t.surcharge)})`).join(" · ")}. Si no querés tocarlo, dejalo como está.
          </p>
        </details>
        {groups.map(([title, opts]) => (
          <Card key={title} title={title}>
            <ul className="divide-y divide-bordo/10">
              {opts.map((o) => {
                const extra = title === "Técnicas y extras" ? DEFAULT_BUILDER_CONFIG.extras.find((e) => e.id === o.id) : undefined;
                return (
                  <li key={o.id} className="grid grid-cols-[1fr_auto] items-end gap-x-3 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_140px_110px_auto]">
                    <input type="hidden" name="id" value={o.id} />
                    <span className="col-span-2 min-w-0 sm:col-span-1 sm:self-center">
                      <span className="font-semibold">{o.label}</span>
                      {extra && (
                        <span className="block text-xs text-ink-soft">
                          por {UNIT_LABEL[extra.unit ?? "mano"]}
                          {extra.retired && " · no aparece en el armador (solo catálogo)"}
                        </span>
                      )}
                    </span>
                    <div className="grid grid-cols-2 gap-3 sm:contents">
                      <label className="block">
                        <span className="mb-0.5 block text-xs text-ink-soft">Suma $</span>
                        <input name={`delta:${o.id}`} type="number" inputMode="numeric" step={1} defaultValue={o.delta} aria-label={`Cuánto suma ${o.label}`} className={adminInput} />
                      </label>
                      <label className="block">
                        <span className="mb-0.5 block text-xs text-ink-soft">Dificultad</span>
                        <input name={`complexity:${o.id}`} type="number" inputMode="numeric" min={0} max={10} defaultValue={o.complexity ?? 0} aria-label={`Dificultad de ${o.label}`} className={adminInput} />
                      </label>
                    </div>
                    <label className="flex min-h-11 flex-col items-center justify-end gap-1 md:min-h-10">
                      <span className="text-xs text-ink-soft">Visible</span>
                      <input type="checkbox" name={`active:${o.id}`} defaultChecked={o.active ?? true} aria-label={`${o.label} visible en el armador`} className="mb-2.5 size-5 accent-bordo" />
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-bordo/10 bg-cream/95 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
          <SubmitButton>Guardar cambios</SubmitButton>
        </div>
      </form>
    </>
  );
}
