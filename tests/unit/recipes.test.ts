import { describe, expect, it } from "vitest";
import { SEED_DESIGNS } from "@/lib/data/catalog";
import { DEFAULT_CHARMS } from "@/lib/data/content";
import { PRESETS } from "@/lib/data/presets";
import { BASE_RECIPE, SEED_SUPPLIES, TECHNIQUE_RECIPES, priceFromCost, recipeMaterials, selectionRecipe, techniqueRecipe } from "@/lib/data/recipes";
import { CATALOG_MAX_PRICE, DEFAULT_BUILDER_CONFIG, quoteSelection } from "@/lib/pricing";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";

const cfg = { ...DEFAULT_BUILDER_CONFIG, charms: DEFAULT_CHARMS };
const supplyIds = new Set(SEED_SUPPLIES.map((s) => s.id));

describe("recetas de costo", () => {
  it("todos los insumos de las recetas existen y los packs tienen cantidad", () => {
    for (const s of SEED_SUPPLIES) expect(s.packQty, s.name).toBeGreaterThan(0);
    for (const u of BASE_RECIPE.usages) expect(supplyIds.has(u.supplyId), u.supplyId).toBe(true);
    for (const [id, t] of Object.entries(TECHNIQUE_RECIPES)) for (const u of t.usages) expect(supplyIds.has(u.supplyId), `${id}: ${u.supplyId}`).toBe(true);
  });

  it("cada técnica del armador tiene receta", () => {
    for (const e of cfg.extras) expect(techniqueRecipe(e.id, e.label), e.id).not.toBeNull();
  });

  it("una técnica en pocas uñas cuesta menos que en las 10, pero no menos del piso", () => {
    const base = { shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: [] } as const;
    const todas = selectionRecipe({ ...base, extras: ["tribal"] }, "t", "t");
    const dos = selectionRecipe({ ...base, extras: [], accent: "anular", accentExtras: ["tribal"] }, "t", "t");
    expect(dos.minutes).toBeLessThan(todas.minutes);
    expect(dos.minutes).toBeGreaterThanOrEqual(BASE_RECIPE.minutes + Math.round(TECHNIQUE_RECIPES.tribal.minutes * 0.4));
  });

  it("el precio de cada diseño cubre su costo con el margen objetivo, no baja de lo que cobra el armador y no pasa el tope", () => {
    const { hourlyRate, targetMargin } = DEFAULT_SETTINGS;
    for (const d of SEED_DESIGNS) {
      const sel = PRESETS[d.slug];
      const r = selectionRecipe(sel, `design:${d.slug}`, d.name);
      const floor = priceFromCost(recipeMaterials(r), r.minutes, hourlyRate, targetMargin);
      expect(d.price, `${d.slug}: piso por costo ${floor}`).toBeGreaterThanOrEqual(floor);
      const armador = quoteSelection(sel, cfg).total;
      expect(d.price, `${d.slug}: el armador cobra ${armador}`).toBeGreaterThanOrEqual(Math.min(armador, CATALOG_MAX_PRICE));
      expect(d.price, `${d.slug}: tope del catálogo`).toBeLessThanOrEqual(CATALOG_MAX_PRICE);
    }
  });
});
