import { promoIsLive, type Promo } from "./data/content";

/**
 * Las promos de la semana que tocan el precio: el descuento a los sets en stock y el 4x3. Las dos salen de las
 * tarjetas de promos (si Brenda la saca o vence, deja de aplicarse) y solo valen para los sets del catálogo, no para
 * los sets a medida del armador. El carrito, el checkout y el servidor calculan con esto mismo.
 */
export type PromoRules = {
  /** Porcentaje de descuento a los sets en stock (0: sin promo). Sale del badge de la tarjeta: "-20%". */
  stockPercent: number;
  /** Llevás 4 sets del catálogo y pagás 3: de cada 4, el más barato va gratis. */
  fourForThree: boolean;
};

export const NO_PROMOS: PromoRules = { stockPercent: 0, fourForThree: false };

/** Qué promos de precio están vigentes (las tarjetas apagadas o vencidas no cuentan). */
export function promoRules(promos: Promo[]): PromoRules {
  const livePromos = promos.filter((p) => promoIsLive(p));
  const stock = livePromos.find((p) => p.id === "stock-20" || p.href?.includes("stock=1"));
  const pct = Number(stock?.badge.match(/(\d{1,2})\s*%/)?.[1] ?? 0);
  const fourForThree = livePromos.some((p) => p.id === "4x3" || p.badge.replace(/\s/g, "").toLowerCase() === "4x3");
  return { stockPercent: pct > 0 && pct < 100 ? pct : 0, fourForThree };
}

export type PromoItem = { kind: "design" | "custom"; unitPrice: number; qty: number; designSlug?: string };
export type PromoLine = { id: "stock" | "4x3"; label: string; amount: number };

/**
 * Descuentos del carrito. Primero el % a los sets en stock (por unidad); después el 4x3 con esos precios: se ordenan
 * todas las unidades del catálogo de la más cara a la más barata y de cada 4 se cobran las 3 más caras y la más
 * barata va gratis (8 sets: 2 gratis, y así).
 */
export function applyPromos(items: PromoItem[], rules: PromoRules, isStock: (slug: string) => boolean) {
  const units: number[] = [];
  let stockOff = 0;
  for (const i of items) {
    if (i.kind !== "design" || !i.designSlug) continue;
    const off = rules.stockPercent && isStock(i.designSlug) ? Math.round((i.unitPrice * rules.stockPercent) / 100) : 0;
    stockOff += off * i.qty;
    for (let n = 0; n < i.qty; n++) units.push(i.unitPrice - off);
  }
  let freeOff = 0;
  if (rules.fourForThree) {
    units.sort((a, b) => b - a);
    for (let k = 3; k < units.length; k += 4) freeOff += units[k];
  }
  const lines: PromoLine[] = [];
  if (stockOff > 0) lines.push({ id: "stock", label: `Promo -${rules.stockPercent}% sets en stock`, amount: stockOff });
  if (freeOff > 0) lines.push({ id: "4x3", label: "Promo 4x3", amount: freeOff });
  return { lines, discount: stockOff + freeOff };
}

/** Lo que un pedido ya creado tiene de descuento por promos: el pedido guarda subtotal sin descuento y total con. */
export function orderDiscount(o: { subtotal: number; total: number; delivery: { cost: number } }): number {
  return Math.max(0, o.subtotal + o.delivery.cost - o.total);
}
