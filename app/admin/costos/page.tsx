import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { listRecipes, listSupplies, recipeCost } from "@/lib/admin/costs";
import { getBuilderConfig, getSettings } from "@/lib/data/settings";
import { getDesigns } from "@/lib/data/repo";
import { formatARS } from "@/lib/format";
import { Card, PageTitle, Stat, tableClass } from "@/components/admin/ui";
import { RecipeEditor } from "@/components/admin/RecipeEditor";
import { quoteSelection, DEFAULT_SELECTION } from "@/lib/pricing";

export default async function CostosPage() {
  await requireAdmin();
  const [supplies, recipes, settings, config, designs] = await Promise.all([listSupplies(), listRecipes(), getSettings(), getBuilderConfig(), getDesigns()]);
  const byId = new Map(supplies.map((s) => [s.id, s]));
  const costOf = (target: string) => {
    const r = recipes.find((x) => x.target === target);
    return r ? recipeCost(r, byId, settings.hourlyRate) : null;
  };
  const baseCost = costOf("base");

  // Targets posibles: base, cada extra del armador y cada diseño del catálogo
  const targets = [
    { target: "base", label: "Set base (10 uñas + pegamento + lima)", price: config.basePrice },
    ...config.extras.map((e) => ({ target: `extra:${e.id}`, label: `Extra: ${e.label}`, price: e.delta })),
    ...designs.map((d) => ({ target: `design:${d.slug}`, label: `Diseño: ${d.name}`, price: d.price })),
  ];

  // Rentabilidad: para extras el costo es incremental sobre el base; para diseños, costo total vs precio total.
  const rows = targets.map((t) => {
    const c = costOf(t.target);
    const isDesign = t.target.startsWith("design:");
    const isExtra = t.target.startsWith("extra:");
    const price = t.price;
    const cost = c ? c.total : null;
    const fullCost = isDesign ? cost : isExtra ? cost : cost; // los extras se comparan contra su delta
    const margin = fullCost != null && price > 0 ? (price - fullCost) / price : null;
    return { ...t, cost: fullCost, materials: c?.materials ?? null, labor: c?.labor ?? null, margin, minutes: recipes.find((r) => r.target === t.target)?.minutes ?? 0 };
  });
  const withMargin = rows.filter((r) => r.margin != null);
  const avgMargin = withMargin.length ? withMargin.reduce((a, r) => a + (r.margin ?? 0), 0) / withMargin.length : null;
  const baseQuote = quoteSelection(DEFAULT_SELECTION, config);

  return (
    <>
      <PageTitle title="Costos y margen">
        Qué insumos y cuánto tiempo lleva cada cosa. Con el valor hora ({formatARS(settings.hourlyRate)}/h) y el margen objetivo ({Math.round(settings.targetMargin * 100)}%) ves si el precio cierra.
        {!hasDb() && " Sin base de datos no se pueden guardar recetas."}
      </PageTitle>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Costo del set base" value={baseCost ? formatARS(baseCost.total) : "sin receta"} hint={baseCost ? `${formatARS(baseCost.materials)} insumos + ${formatARS(baseCost.labor)} tiempo` : "Cargá la receta 'base'"} />
        <Stat label="Precio base" value={formatARS(baseQuote.total)} hint={baseCost ? `margen ${Math.round(((baseQuote.total - baseCost.total) / baseQuote.total) * 100)}%` : undefined} />
        <Stat label="Margen promedio" value={avgMargin != null ? `${Math.round(avgMargin * 100)}%` : "–"} hint={`objetivo ${Math.round(settings.targetMargin * 100)}%`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title="Rentabilidad por ítem">
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Ítem</th>
                  <th>Precio</th>
                  <th>Costo</th>
                  <th>Min.</th>
                  <th>Margen</th>
                  <th>Precio sugerido</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const ok = r.margin != null && r.margin >= settings.targetMargin;
                  const suggested = r.cost != null ? r.cost / (1 - settings.targetMargin) : null;
                  return (
                    <tr key={r.target}>
                      <td>
                        <span className="font-semibold">{r.label}</span>
                        <div className="text-[11px] text-ink-soft">{r.target}</div>
                      </td>
                      <td>{formatARS(r.price)}</td>
                      <td>{r.cost != null ? formatARS(r.cost) : <span className="text-xs text-ink-soft">sin receta</span>}</td>
                      <td>{r.minutes || "–"}</td>
                      <td>
                        {r.margin != null ? (
                          <span className={ok ? "font-bold text-emerald-700" : "font-bold text-red"}>{Math.round(r.margin * 100)}%</span>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="text-ink-soft">{suggested != null ? formatARS(Math.ceil(suggested / 100) * 100) : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            Para los extras el costo es lo que agrega esa técnica sobre el set base y se compara contra lo que suma de precio. El precio sugerido es el que cumple el margen objetivo.
          </p>
        </Card>
        <RecipeEditor supplies={supplies} recipes={recipes} targets={targets.map((t) => ({ target: t.target, label: t.label }))} dbReady={hasDb()} />
      </div>
    </>
  );
}
