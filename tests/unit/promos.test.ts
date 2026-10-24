import { describe, expect, it } from "vitest";
import { DEFAULT_PROMOS } from "@/lib/data/content";
import { applyPromos, NO_PROMOS, orderDiscount, promoRules, type PromoItem } from "@/lib/promos";

const rules = promoRules(DEFAULT_PROMOS);
const stock = (slug: string) => slug.startsWith("stock");
const set = (designSlug: string, unitPrice: number, qty = 1): PromoItem => ({ kind: "design", designSlug, unitPrice, qty });

describe("promos de la semana en el carrito", () => {
  it("salen de las tarjetas: -20% a los sets en stock y 4x3", () => {
    expect(rules).toEqual({ stockPercent: 20, fourForThree: true });
    expect(promoRules(DEFAULT_PROMOS.map((p) => ({ ...p, active: false })))).toEqual(NO_PROMOS);
    expect(promoRules([])).toEqual(NO_PROMOS);
  });

  it("el 20% va solo a los sets en stock", () => {
    const r = applyPromos([set("stock-a", 10000, 2), set("comun", 10000)], rules, stock);
    expect(r.discount).toBe(4000);
    expect(r.lines).toEqual([{ id: "stock", label: "Promo -20% sets en stock", amount: 4000 }]);
  });

  it("4x3: se cobran las 3 más caras y la más barata va gratis", () => {
    const r = applyPromos([set("a", 20000), set("b", 15000), set("c", 12000), set("d", 9000)], rules, stock);
    expect(r.discount).toBe(9000);
    expect(r.lines).toEqual([{ id: "4x3", label: "Promo 4x3", amount: 9000 }]);
  });

  it("4x3 cuenta unidades: 3 sets no tienen regalo, 8 tienen 2 (el más barato de cada 4)", () => {
    expect(applyPromos([set("a", 10000, 3)], rules, stock).discount).toBe(0);
    const r = applyPromos([set("a", 20000, 4), set("b", 10000, 4)], rules, stock);
    expect(r.discount).toBe(20000 + 10000);
  });

  it("no se suman: se aplica la que más le conviene a la clienta", () => {
    // 4x3 (gratis el de 10000) le gana al 20% del set en stock (2000)
    const a = applyPromos([set("stock-a", 10000), set("b", 12000, 3)], rules, stock);
    expect(a.lines).toEqual([{ id: "4x3", label: "Promo 4x3", amount: 10000 }]);
    expect(a.discount).toBe(10000);
    // 3 sets en stock caros y uno común barato: el 20% (3 × 4000) le gana a regalar el más barato (5000)
    const b = applyPromos([set("stock-a", 20000, 3), set("c", 5000)], rules, stock);
    expect(b.lines).toEqual([{ id: "stock", label: "Promo -20% sets en stock", amount: 12000 }]);
  });

  it("los sets a medida del armador no entran en las promos", () => {
    const custom: PromoItem = { kind: "custom", unitPrice: 30000, qty: 4 };
    expect(applyPromos([custom], rules, stock).discount).toBe(0);
  });

  it("sin promos vigentes no hay descuento", () => {
    expect(applyPromos([set("stock-a", 10000, 4)], NO_PROMOS, stock).discount).toBe(0);
  });

  it("el pedido guarda el descuento como subtotal + envío − total", () => {
    expect(orderDiscount({ subtotal: 40000, total: 33000, delivery: { cost: 3000 } })).toBe(10000);
    expect(orderDiscount({ subtotal: 40000, total: 43000, delivery: { cost: 3000 } })).toBe(0);
  });
});
