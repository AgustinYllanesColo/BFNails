import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import type { CartItem, OrderStatus } from "@/lib/types";
import { getMakeupBase } from "./content-repo";
import { addMakeupSold, applyMakeupSold, makeupDemand, makeupShortage, type MakeupSold } from "./makeup";

/**
 * Stock del maquillaje que se descuenta solo.
 *
 * El stock cargado (settings.makeup, o el de lib/data/makeup.ts) no se toca en cada venta: lo vendido se lleva aparte en
 * settings.makeup_sold ({ id: unidades }) y el stock real es cargado − vendido. Así el catálogo se puede seguir editando
 * desde el código o el admin sin pisar las ventas. Cuando Brenda guarda un producto desde el admin, lo que guarda ya es el
 * stock real, y lo vendido vuelve a cero (resetMakeupSold).
 *
 * - Un pedido nuevo reserva sus unidades en el momento (reserveMakeup), con la fila bloqueada: si dos clientas piden a la
 *   vez la última unidad, una sola la consigue.
 * - Un pedido cancelado las devuelve (releaseMakeup); si se reactiva, las vuelve a tomar (sin control: ya estaban vendidas).
 * - Los combos descuentan lo que traen.
 * Sin base de datos (local, tests) no hace nada.
 */

const KEY = "makeup_sold";
type Line = { makeupId: string; qty: number };

export function makeupLinesOf(items: CartItem[]): Line[] {
  return items.flatMap((i) => (i.kind === "makeup" ? [{ makeupId: i.makeupId, qty: i.qty }] : []));
}

async function change(lines: Line[], sign: 1 | -1, check: boolean): Promise<string | null> {
  const db = getDb();
  if (!db || lines.length === 0) return null;
  const base = await getMakeupBase();
  const demand = makeupDemand(lines, base);
  return db.transaction(async (tx) => {
    await tx.insert(settings).values({ key: KEY, value: {}, updatedAt: new Date() }).onConflictDoNothing();
    const [row] = await tx.select().from(settings).where(eq(settings.key, KEY)).for("update");
    const sold = ((row?.value as MakeupSold | null) ?? {}) as MakeupSold;
    if (check && sign === 1) {
      const short = makeupShortage(demand, applyMakeupSold(base, sold));
      if (short)
        return short.left === 0
          ? `${short.product.name} se acaba de agotar. Sacalo del carrito para seguir.`
          : `De ${short.product.name} ${short.left === 1 ? "queda 1 unidad" : `quedan ${short.left} unidades`}. Bajá la cantidad en el carrito.`;
    }
    await tx
      .update(settings)
      .set({ value: addMakeupSold(sold, demand, sign), updatedAt: sql`now()` })
      .where(eq(settings.key, KEY));
    return null;
  });
}

/** Toma las unidades de un pedido nuevo. Devuelve el mensaje para la clienta si ya no alcanzan (y no toma nada). */
export function reserveMakeup(lines: Line[]): Promise<string | null> {
  return change(lines, 1, true);
}

/** Devuelve al stock las unidades de un pedido. */
export async function releaseMakeup(lines: Line[]): Promise<void> {
  await change(lines, -1, false);
}

/** Lo que guardó el admin ya es el stock real: lo vendido vuelve a cero. */
export async function resetMakeupSold(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .insert(settings)
    .values({ key: KEY, value: {}, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value: {}, updatedAt: new Date() } });
}

/**
 * Ajusta el stock cuando un pedido cambia de estado: al cancelarse devuelve sus unidades y al salir de "cancelado" las
 * vuelve a tomar. Cualquier error se registra y no frena el cambio de estado.
 */
export async function syncMakeupOnStatus(items: CartItem[], before: OrderStatus, after: OrderStatus): Promise<void> {
  const lines = makeupLinesOf(items);
  if (!lines.length || before === after) return;
  try {
    if (after === "cancelado") await releaseMakeup(lines);
    else if (before === "cancelado") await change(lines, 1, false);
  } catch (err) {
    console.error("[stock] no se pudo ajustar el stock del maquillaje", err);
  }
}
