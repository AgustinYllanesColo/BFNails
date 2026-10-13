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

  it("suma deltas de forma, largo y acabado", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, shape: "stiletto", length: "xl", finish: "mate" });
    expect(q.total).toBe(12000 + 800 + 2000 + 500);
  });

  it("los extras suman precio y puntos de complejidad con recargo por nivel", () => {
    const q = quoteSelection({ ...DEFAULT_SELECTION, finish: "cromado", extras: ["francesita", "strass", "personajes"] });
    // base 12000 + cromado 2500 + francesita 1500 + strass 2000 + personajes 4000 = 22000
    // puntos: 1 + 1 + 1 + 3 = 6 → nivel elaborado (+2500)
    expect(q.complexity).toBe(3);
    expect(q.complexityLabel).toBe("Elaborado");
    expect(q.total).toBe(22000 + 2500);
    expect(q.lines.find((l) => l.id === "complexity")?.amount).toBe(2500);
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
