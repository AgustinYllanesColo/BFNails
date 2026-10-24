import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDER_CONFIG, DEFAULT_SELECTION, quoteSelection, tierForPoints } from "@/lib/pricing";

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
    expect(q.total).toBe(12000 + 1500);
    expect(quoteSelection({ ...DEFAULT_SELECTION, length: "largo", finish: "mate" }).total).toBe(12000);
    expect(DEFAULT_BUILDER_CONFIG.shapes.map((s) => s.id)).not.toContain("ovalada");
    expect(DEFAULT_BUILDER_CONFIG.finishes.map((f) => f.id)).toEqual(["glossy", "mate"]);
  });

  it("los extras suman precio y puntos de complejidad con recargo por nivel", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, extras: ["blooming", "francesita", "strass", "personajes"] });
    // en las 10 uñas cada técnica se cobra por las dos manos:
    // base 12000 + blooming 5000 + francesita 3000 + strass 4000 + personajes 8000 = 32000
    // puntos: 1 + 1 + 1 + 3 = 6 → nivel elaborado (+2500)
    expect(q.complexity).toBe(3);
    expect(q.complexityLabel).toBe("Elaborado");
    expect(q.total).toBe(32000 + 2500);
    expect(q.lines.find((l) => l.id === "complexity")?.amount).toBe(2500);
  });

  it("las técnicas se cobran por mano, y una uña sola a precio de uña", () => {
    const francesita = DEFAULT_BUILDER_CONFIG.extras.find((e) => e.id === "francesita")!;
    const on = (nails: number[]) => quoteSelection({ ...DEFAULT_SELECTION, nailDesigns: Array.from({ length: 10 }, (_, i) => (nails.includes(i) ? { extras: ["francesita"] } : null)) });
    expect(on([0, 1, 2, 3, 4]).lines.find((l) => l.id === "extra:francesita")).toEqual({ id: "extra:francesita", label: "Francesita (mano derecha)", amount: 1500 });
    expect(on([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).lines.find((l) => l.id === "extra:francesita")?.amount).toBe(3000);
    expect(on([3]).lines.find((l) => l.id === "extra:francesita")).toEqual({ id: "extra:francesita", label: "Francesita (anular derecha)", amount: 800 });
    expect(on([3, 8]).lines.find((l) => l.id === "extra:francesita")?.amount).toBe(1600);
    expect(on([1, 3, 8]).lines.find((l) => l.id === "extra:francesita")?.amount).toBe(1500 + 800);
    expect(francesita.delta).toBe(1500);
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
