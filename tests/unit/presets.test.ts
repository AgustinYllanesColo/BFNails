import { describe, expect, it } from "vitest";
import { SEED_DESIGNS } from "@/lib/data/catalog";
import { PRESETS, presetFor } from "@/lib/data/presets";
import { DEFAULT_BUILDER_CONFIG, accentMode, isAccentNail, quoteSelection } from "@/lib/pricing";
import { DEFAULT_CHARMS } from "@/lib/data/content";
import { qtyForNails } from "@/lib/charms";

const cfg = DEFAULT_BUILDER_CONFIG;
const colorIds = new Set(cfg.bases.map((b) => b.id));
const extraIds = new Set(cfg.extras.map((e) => e.id));
const charms = new Map(DEFAULT_CHARMS.map((c) => [c.id, c]));

describe("todo el catálogo se puede armar en el armador", () => {
  it.each(SEED_DESIGNS.map((d) => [d.slug, d] as const))("%s tiene receta válida", (slug, d) => {
    const p = PRESETS[slug];
    expect(p, `falta la receta de ${slug} en lib/data/presets.ts`).toBeDefined();
    expect(p.shape).toBe(d.shape);
    expect(p.length).toBe(d.length);
    for (const c of [p.base, p.tipColor, p.detailColor, p.degradeColor, p.accentColor].filter(Boolean))
      expect(colorIds.has(c!), `color ${c}`).toBe(true);
    for (const e of [...p.extras, ...(p.accentExtras ?? []), ...(p.nailDesigns ?? []).flatMap((d) => d?.extras ?? [])]) expect(extraIds.has(e), `técnica ${e}`).toBe(true);
    for (const c of p.charms ?? []) {
      const charm = charms.get(c.id);
      expect(charm, `dije ${c.id}`).toBeDefined();
      // los dijes de las recetas se ven en la mano: tienen pieza recortada y uñas, y la cantidad sale de las uñas
      expect(charm!.piece, `pieza de ${c.id}`).toBeDefined();
      expect(c.qty).toBe(qtyForNails(c.nails ?? []));
    }
    expect(quoteSelection(p, { ...cfg, charms: DEFAULT_CHARMS }).total).toBeGreaterThanOrEqual(cfg.basePrice);
  });

  it("presetFor devuelve una copia (editar en el armador no toca la receta)", () => {
    const a = presetFor("leo-cherry")!;
    a.extras.push("glitter");
    a.accentExtras!.push("strass");
    expect(PRESETS["leo-cherry"].extras).not.toContain("glitter");
    expect(PRESETS["leo-cherry"].accentExtras).not.toContain("strass");
    expect(presetFor("no-existe")).toBeNull();
  });
});

describe("uñas acento", () => {
  it("cada modo marca las uñas correctas (0 pulgar … 4 meñique)", () => {
    const on = (m: Parameters<typeof isAccentNail>[0]) => [0, 1, 2, 3, 4].filter((i) => isAccentNail(m, i));
    expect(on("ninguno")).toEqual([]);
    expect(on("anular")).toEqual([3]);
    expect(on("anular-mayor")).toEqual([2, 3]);
    expect(on("pulgar-menique")).toEqual([0, 4]);
    expect(on("alternadas")).toEqual([1, 3]);
  });

  it("traduce los valores viejos de carritos guardados", () => {
    expect(accentMode({ accent: "todas" })).toBe("ninguno");
    expect(accentMode({ accent: "acento" })).toBe("anular");
    expect(accentMode({})).toBe("ninguno");
  });

  it("las técnicas de los acentos se cobran una vez y no si ya están en el set", () => {
    const base = { shape: "almendra", length: "medio", finish: "glossy", base: "rojo", extras: [] } as const;
    const sin = quoteSelection({ ...base, extras: [] }, cfg).subtotal;
    const con = quoteSelection({ ...base, extras: [], accent: "anular", accentExtras: ["animal-print"] }, cfg);
    // anular de las dos manos: 2 de las 10 uñas
    expect(con.lines.find((l) => l.id === "extra:animal-print")?.label).toBe("Animal print (2 uñas)");
    expect(con.subtotal).toBeGreaterThan(sin);
    const doble = quoteSelection({ ...base, extras: ["animal-print"], accent: "anular", accentExtras: ["animal-print"] }, cfg);
    expect(doble.lines.filter((l) => l.id.endsWith("animal-print"))).toHaveLength(1);
    // sin acentos, las técnicas de acento no cuentan
    const apagado = quoteSelection({ ...base, extras: [], accent: "ninguno", accentExtras: ["animal-print"] }, cfg);
    expect(apagado.subtotal).toBe(sin);
  });

  it("uña por uña: cada técnica se cobra una vez aunque esté en varias uñas", () => {
    const base = { shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: [] as string[] } as const;
    const nailDesigns = Array.from({ length: 10 }, (_, i) => (i === 1 || i === 8 ? { color: "rosa", extras: ["flor-3d"] } : null));
    const q = quoteSelection({ ...base, nailDesigns }, cfg);
    const flor = q.lines.filter((l) => l.id === "extra:flor-3d");
    expect(flor).toHaveLength(1);
    expect(flor[0].label).toBe("Flor 3D (organza) (2 uñas)");
  });
});
