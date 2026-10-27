import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDER_CONFIG, DEFAULT_SELECTION, extraPrice, nailPrice, quoteSelection, tierForPoints } from "@/lib/pricing";

describe("quoteSelection", () => {
  it("set base sin extras cuesta el precio base y es nivel simple", () => {
    const q = quoteSelection(DEFAULT_SELECTION);
    expect(q.total).toBe(DEFAULT_BUILDER_CONFIG.basePrice);
    expect(q.complexity).toBe(1);
    expect(q.needsConfirmation).toBe(false);
    expect(q.lines).toHaveLength(1);
  });

  it("solo el largo XL suma; la forma y el acabado no cambian el precio", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, shape: "stiletto", length: "xl", finish: "mate" });
    expect(q.total).toBe(13000 + 1500);
    expect(quoteSelection({ ...DEFAULT_SELECTION, length: "largo", finish: "mate" }).total).toBe(13000);
    expect(DEFAULT_BUILDER_CONFIG.shapes.map((s) => s.id)).not.toContain("ovalada");
    expect(DEFAULT_BUILDER_CONFIG.finishes.map((f) => f.id)).toEqual(["glossy", "mate"]);
  });

  it("los extras suman precio y puntos de complejidad con recargo por nivel", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, extras: ["blooming", "francesita", "strass", "personajes"] });
    // en las 10 uñas: blooming por uña 300×10, francesita por mano 1500×2, strass por set 1200, personajes por uña 800×10
    // base 13000 + 3000 + 3000 + 1200 + 8000 = 28200; puntos: 1 + 1 + 1 + 3 = 6 → nivel elaborado (+2500)
    expect(q.complexity).toBe(3);
    expect(q.complexityLabel).toBe("Elaborado");
    expect(q.total).toBe(28200 + 2500);
    expect(q.lines.find((l) => l.id === "complexity")?.amount).toBe(2500);
  });

  it("las técnicas por mano se cobran proporcional a las uñas: cada uña vale la quinta parte", () => {
    const francesita = DEFAULT_BUILDER_CONFIG.extras.find((e) => e.id === "francesita")!;
    const on = (nails: number[]) => quoteSelection({ ...DEFAULT_SELECTION, nailDesigns: Array.from({ length: 10 }, (_, i) => (nails.includes(i) ? { extras: ["francesita"] } : null)) });
    expect(on([0, 1, 2, 3, 4]).lines.find((l) => l.id === "extra:francesita")).toEqual({ id: "extra:francesita", label: "Francesita (mano derecha)", amount: 1500 });
    expect(on([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).lines.find((l) => l.id === "extra:francesita")?.amount).toBe(3000);
    expect(on([3]).lines.find((l) => l.id === "extra:francesita")).toEqual({ id: "extra:francesita", label: "Francesita (anular derecha)", amount: 300 });
    expect(on([3, 8]).lines.find((l) => l.id === "extra:francesita")?.amount).toBe(600);
    expect(on([1, 3, 8]).lines.find((l) => l.id === "extra:francesita")?.amount).toBe(900);
    expect(francesita.delta).toBe(1500);
    // vale para todas las técnicas por mano: aura $1.500 por mano → $300 la uña
    const aura = DEFAULT_BUILDER_CONFIG.extras.find((e) => e.id === "aura")!;
    expect(aura.delta).toBe(1500);
    expect(extraPrice(aura, [2])).toBe(300);
    expect(extraPrice(aura, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(3000);
    for (const e of DEFAULT_BUILDER_CONFIG.extras.filter((x) => (x.unit ?? "mano") === "mano")) {
      expect(nailPrice(e)).toBe(Math.round(e.delta / 5));
      expect(extraPrice(e, [0, 1, 2, 3, 4])).toBe(e.delta);
    }
  });

  it("los diseños se cobran por uña y los apliques por set", () => {
    const on = (id: string, nails: number[]) => quoteSelection({ ...DEFAULT_SELECTION, nailDesigns: Array.from({ length: 10 }, (_, i) => (nails.includes(i) ? { extras: [id] } : null)) }).lines.find((l) => l.id === `extra:${id}`)?.amount;
    expect(on("animal-print", [3])).toBe(400);
    expect(on("animal-print", [0, 4, 5, 9])).toBe(1600);
    expect(on("strass", [3])).toBe(1200);
    expect(on("strass", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(1200);
    expect(on("cromado", [1, 6])).toBe(1000);
  });

  it("las técnicas retiradas no se ofrecen pero se siguen cobrando en las recetas del catálogo", () => {
    const retired = DEFAULT_BUILDER_CONFIG.extras.filter((e) => e.retired).map((e) => e.id);
    expect(retired).toEqual(expect.arrayContaining(["tribal", "perlas", "cadenas", "encapsulado", "strass-full"]));
    for (const id of ["carey", "cromado", "francesita", "animal-print", "strass"]) expect(retired).not.toContain(id);
    expect(quoteSelection({ ...DEFAULT_SELECTION, extras: ["tribal"] }).lines.find((l) => l.id === "extra:tribal")?.amount).toBe(5000);
  });

  it("la francesita de color de los carritos viejos es la francesita de hoy", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, extras: ["francesita-color"], tipColor: "negro" });
    expect(q.lines.find((l) => l.id === "extra:francesita")?.amount).toBe(3000);
    expect(q.lines.filter((l) => l.id.startsWith("extra:"))).toHaveLength(1);
  });

  it("llega a premium con muchos puntos", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, extras: ["strass-full", "3d", "a-mano", "personajes"] });
    expect(q.complexity).toBe(4);
  });

  it("ignora ids de extras desconocidos", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, extras: ["no-existe"] });
    expect(q.total).toBe(DEFAULT_BUILDER_CONFIG.basePrice);
  });

  it("las notas libres marcan el pedido a confirmar", () => {
    expect(quoteSelection({ ...DEFAULT_SELECTION, notes: "una K dorada" }).needsConfirmation).toBe(true);
    expect(quoteSelection({ ...DEFAULT_SELECTION, notes: "   " }).needsConfirmation).toBe(false);
  });

  it("es determinista", () => {
    const sel = { ...DEFAULT_SELECTION, extras: ["glitter", "flores"] };
    expect(quoteSelection(sel)).toEqual(quoteSelection(sel));
  });
});

describe("tierForPoints", () => {
  it("elige el nivel más alto alcanzado", () => {
    const tiers = DEFAULT_BUILDER_CONFIG.tiers;
    expect(tierForPoints(0, tiers).level).toBe(1);
    expect(tierForPoints(1, tiers).level).toBe(1);
    expect(tierForPoints(2, tiers).level).toBe(2);
    expect(tierForPoints(4, tiers).level).toBe(3);
    expect(tierForPoints(99, tiers).level).toBe(4);
  });
});
