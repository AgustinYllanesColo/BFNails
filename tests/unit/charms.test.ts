import { describe, expect, it } from "vitest";
import { defaultCharmNails, describeNails, qtyForNails } from "@/lib/charms";
import { DEFAULT_CHARMS } from "@/lib/data/content";
import { DEFAULT_BUILDER_CONFIG, DEFAULT_SELECTION, quoteSelection } from "@/lib/pricing";

describe("dijes ubicados por uña", () => {
  it("cada uña elegida lleva un dije en cada mano", () => {
    expect(qtyForNails([3])).toBe(2);
    expect(qtyForNails([2, 3])).toBe(4);
    expect(qtyForNails([])).toBe(0);
  });

  it("arrancan en las uñas acento, o en el anular si no hay", () => {
    expect(defaultCharmNails({})).toEqual([3]);
    expect(defaultCharmNails({ accent: "pulgar-menique" })).toEqual([0, 4]);
  });

  it("se describen para Brenda", () => {
    expect(describeNails([3])).toBe("anular de las dos manos");
    expect(describeNails([3, 0, 2])).toBe("pulgar, mayor y anular de las dos manos");
    expect(describeNails([])).toBeNull();
  });

  it("el presupuesto cobra la cantidad de dijes por su precio", () => {
    const cfg = { ...DEFAULT_BUILDER_CONFIG, charms: DEFAULT_CHARMS };
    const cerezas = DEFAULT_CHARMS.find((c) => c.id === "cerezas")!;
    const q = quoteSelection({ ...DEFAULT_SELECTION, charms: [{ id: "cerezas", qty: 4, nails: [2, 3] }] }, cfg);
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
