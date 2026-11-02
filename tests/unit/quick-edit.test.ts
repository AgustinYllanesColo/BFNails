import { describe, expect, it } from "vitest";
import { applyQuickEdits, parseQuickEdits } from "@/lib/admin/quick-edit";

const fd = (entries: [string, string][]) => {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
};

describe("carga rápida de precios y stock", () => {
  it("lee precio, precio antes, stock y disponible de cada fila", () => {
    const rows = parseQuickEdits(
      fd([
        ["row", "a"], ["price:a", "3500"], ["before:a", "4000"], ["stock:a", "7"], ["active:a", "on"],
        ["row", "b"], ["price:b", "1200"], ["before:b", ""], ["stock:b", ""],
      ]),
    );
    expect(rows.get("a")).toEqual({ price: 3500, priceBefore: 4000, stock: 7, active: true });
    expect(rows.get("b")).toEqual({ price: 1200, priceBefore: undefined, stock: undefined, active: false });
  });

  it("descarta valores inválidos: el precio queda como estaba", () => {
    const rows = parseQuickEdits(fd([["row", "a"], ["price:a", "-5"], ["stock:a", "abc"]]));
    expect(rows.get("a")?.price).toBeUndefined();
    expect(rows.get("a")?.stock).toBeUndefined();
  });

  it("aplica los cambios solo a las filas enviadas y respeta lo que no se tocó", () => {
    const list = [
      { id: "a", price: 100, priceBefore: undefined as number | undefined, stock: 1 as number | undefined, active: true, name: "A" },
      { id: "z", price: 900, priceBefore: undefined, stock: 2, active: true, name: "Z" },
    ];
    const rows = parseQuickEdits(fd([["row", "a"], ["price:a", "150"], ["before:a", "200"], ["stock:a", "0"]]));
    const out = applyQuickEdits(list, rows, { stock: true });
    expect(out[0]).toEqual({ id: "a", price: 150, priceBefore: 200, stock: 0, active: false, name: "A" });
    expect(out[1]).toBe(list[1]);
  });

  it("un precio antes que no supera al precio no es oferta", () => {
    const list = [{ id: "a", price: 100, active: true }];
    const out = applyQuickEdits(list, parseQuickEdits(fd([["row", "a"], ["price:a", "300"], ["before:a", "200"], ["active:a", "on"]])), {});
    expect(out[0]).toEqual({ id: "a", price: 300, priceBefore: undefined, active: true });
  });
});
