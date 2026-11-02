import { describe, expect, it } from "vitest";
import { addMakeupSold, applyMakeupSold, checkMakeupLines, makeupDemand, makeupShortage, type MakeupProduct } from "@/lib/data/makeup";

const prod = (id: string, stock?: number, extra: Partial<MakeupProduct> = {}): MakeupProduct => ({
  id,
  name: id,
  category: "labios",
  form: "labial",
  price: 1000,
  stock,
  active: true,
  ...extra,
});

const all: MakeupProduct[] = [
  prod("lapiz", 12),
  prod("mascara", 2),
  prod("brocha"),
  prod("combo", undefined, {
    category: "combos",
    form: "combo",
    price: 8000,
    includes: [
      { id: "lapiz", qty: 1 },
      { id: "mascara", qty: 1 },
      { id: "brocha", qty: 1 },
    ],
  }),
];

describe("stock del maquillaje", () => {
  it("un combo se abre en lo que trae", () => {
    const d = makeupDemand([{ makeupId: "combo", qty: 2 }, { makeupId: "mascara", qty: 1 }], all);
    expect(Object.fromEntries(d)).toEqual({ lapiz: 2, mascara: 3, brocha: 2 });
  });

  it("lo vendido baja el stock y el combo queda con lo que alcanza del producto más justo", () => {
    const real = applyMakeupSold(all, { mascara: 1, lapiz: 3 });
    expect(real.find((m) => m.id === "mascara")!.stock).toBe(1);
    expect(real.find((m) => m.id === "lapiz")!.stock).toBe(9);
    expect(real.find((m) => m.id === "combo")!.stock).toBe(1);
    expect(real.find((m) => m.id === "brocha")!.stock).toBeUndefined();
  });

  it("si se agota un producto del combo, el combo queda agotado", () => {
    const real = applyMakeupSold(all, { mascara: 2 });
    expect(real.find((m) => m.id === "combo")!.stock).toBe(0);
  });

  it("vender y cancelar deja todo como estaba", () => {
    const d = makeupDemand([{ makeupId: "combo", qty: 1 }], all);
    const sold = addMakeupSold({}, d, 1);
    expect(sold).toEqual({ lapiz: 1, mascara: 1, brocha: 1 });
    expect(addMakeupSold(sold, d, -1)).toEqual({});
  });

  it("detecta que no alcanza aunque el faltante venga de sumar suelto y combo", () => {
    const d = makeupDemand([{ makeupId: "combo", qty: 1 }, { makeupId: "mascara", qty: 2 }], all);
    expect(makeupShortage(d, all)?.product.id).toBe("mascara");
    expect(checkMakeupLines([{ makeupId: "combo", qty: 1 }, { makeupId: "mascara", qty: 2 }], all)).toMatch(/mascara/);
    expect(checkMakeupLines([{ makeupId: "combo", qty: 1 }, { makeupId: "mascara", qty: 1 }], all)).toBeNull();
  });

  it("no deja pedir más combos de los que permite el stock", () => {
    const real = applyMakeupSold(all, { mascara: 1 });
    expect(checkMakeupLines([{ makeupId: "combo", qty: 2 }], real)).not.toBeNull();
    expect(checkMakeupLines([{ makeupId: "combo", qty: 1 }], real)).toBeNull();
  });
});
