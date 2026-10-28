import { describe, expect, it } from "vitest";
import { designVariantPrice, fourForThree } from "@/lib/pricing";
import { fourForThreeLive, type Promo } from "@/lib/data/content";

const set = (key: string, unitPrice: number, qty = 1, kind = "design") => ({ key, kind, unitPrice, qty });

describe("fourForThree", () => {
  it("con menos de 4 sets no regala nada", () => {
    expect(fourForThree([set("a", 13000, 3)]).discount).toBe(0);
  });
  it("de 4 sets regala el más barato", () => {
    const r = fourForThree([set("a", 19500), set("b", 13000), set("c", 15000), set("d", 16000)]);
    expect(r.discount).toBe(13000);
    expect(r.free.get("b")).toBe(1);
  });
  it("con 8 regala dos y los dijes o sets a medida no cuentan", () => {
    const r = fourForThree([set("a", 10000, 8), set("x", 1000, 5, "charm"), set("y", 20000, 1, "custom")]);
    expect(r.discount).toBe(20000);
    expect(r.free.get("a")).toBe(2);
  });
});

describe("designVariantPrice con oferta", () => {
  const leo = { price: 13000, priceBefore: 19500, shape: "almendra" as const, length: "medio" as const, tags: ["stock", "talle M"] };
  it("el set en stock, en su talle, sale al precio de oferta", () => {
    expect(designVariantPrice(leo, "almendra", "medio", undefined, { mode: "standard", size: "M" })).toBe(13000);
  });
  it("otro talle o medida personalizada vuelve al precio de lista", () => {
    expect(designVariantPrice(leo, "almendra", "medio", undefined, { mode: "standard", size: "S" })).toBe(19500);
    expect(designVariantPrice(leo, "almendra", "medio", undefined, { mode: "kit" })).toBe(19500);
  });
  it("otra forma también es a pedido", () => {
    expect(designVariantPrice(leo, "coffin", "medio")).toBeGreaterThanOrEqual(19500);
  });
});

describe("fourForThreeLive", () => {
  const p = (o: Partial<Promo>): Promo => ({ id: "x", badge: "", title: "", theme: "rosa", active: true, ...o }) as Promo;
  it("se reconoce por id o por el cartel y respeta activa/vencida", () => {
    expect(fourForThreeLive([p({ id: "4x3" })])).toBe(true);
    expect(fourForThreeLive([p({ badge: "4 x 3" })])).toBe(true);
    expect(fourForThreeLive([p({ id: "4x3", active: false })])).toBe(false);
    expect(fourForThreeLive([p({ id: "4x3", until: "2020-01-01" })])).toBe(false);
    expect(fourForThreeLive([p({ badge: "$13.000" })])).toBe(false);
  });
});
