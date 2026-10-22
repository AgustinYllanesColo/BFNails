import { describe, expect, it } from "vitest";
import { describeNails, qtyForNails } from "@/lib/charms";
import { DEFAULT_CHARMS } from "@/lib/data/content";
import { DEFAULT_BUILDER_CONFIG, DEFAULT_SELECTION, quoteSelection } from "@/lib/pricing";

describe("dijes ubicados por uña", () => {
  it("va un dije por uña elegida (las 10 uñas, de las dos manos)", () => {
    expect(qtyForNails([3])).toBe(1);
    expect(qtyForNails([3, 8])).toBe(2);
    expect(qtyForNails([])).toBe(0);
  });

  it("se describen para Brenda, mano por mano", () => {
    expect(describeNails([3, 8])).toBe("anular de las dos manos");
    expect(describeNails([1, 8])).toBe("índice derecha y anular izquierda");
    expect(describeNails([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe("las 10 uñas");
    expect(describeNails([])).toBeNull();
  });

  it("el presupuesto cobra la cantidad de dijes por su precio", () => {
    const cfg = { ...DEFAULT_BUILDER_CONFIG, charms: DEFAULT_CHARMS };
    const cerezas = DEFAULT_CHARMS.find((c) => c.id === "cerezas")!;
    const q = quoteSelection({ ...DEFAULT_SELECTION, charms: [{ id: "cerezas", qty: 4, nails: [2, 3, 7, 8] }] }, cfg);
    expect(q.lines.find((l) => l.id === "charm:cerezas")?.amount).toBe(cerezas.price * 4);
  });

  it("todos los dijes tienen foto, categoría e id único", () => {
    const ids = new Set(DEFAULT_CHARMS.map((c) => c.id));
    expect(ids.size).toBe(DEFAULT_CHARMS.length);
    for (const c of DEFAULT_CHARMS) {
      expect(c.image, c.id).toMatch(/^\/dijes\//);
      expect(c.category, c.id).toBeDefined();
    }
  });
});
