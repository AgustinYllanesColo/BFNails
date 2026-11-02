import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { DEFAULT_MAKEUP, applyMakeupSold, normalizeMakeupList, toPublicMakeup, type MakeupProduct, type MakeupSold } from "./makeup";
import { DEFAULT_CHARMS, DEFAULT_KIT, DEFAULT_PROMOS, promoIsLive, type Charm, type Kit, type Promo } from "./content";

type ContentMap = { promos: Promo[]; charms: Charm[]; kit: Kit; makeup: MakeupProduct[]; makeup_sold: MakeupSold };
const DEFAULTS: ContentMap = { promos: DEFAULT_PROMOS, charms: DEFAULT_CHARMS, kit: DEFAULT_KIT, makeup: DEFAULT_MAKEUP, makeup_sold: {} };

async function read<K extends keyof ContentMap>(key: K): Promise<ContentMap[K]> {
  const db = getDb();
  if (!db) return DEFAULTS[key];
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return (row?.value as ContentMap[K] | undefined) ?? DEFAULTS[key];
}

export async function writeContent<K extends keyof ContentMap>(key: K, value: ContentMap[K]) {
  const db = getDb();
  if (!db) throw new Error("Sin base de datos");
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export const getAllPromos = () => read("promos");
export const getAllCharms = () => read("charms");
export const getKit = () => read("kit");

export async function getLivePromos(): Promise<Promo[]> {
  return (await getAllPromos()).filter((p) => promoIsLive(p));
}

export async function getCharms(): Promise<Charm[]> {
  return (await getAllCharms()).filter((c) => c.active);
}

/** El maquillaje tal como está cargado (sin descontar lo vendido). */
export async function getMakeupBase(): Promise<MakeupProduct[]> {
  return normalizeMakeupList(await read("makeup")) ?? DEFAULT_MAKEUP;
}

/**
 * Todo el maquillaje, para el admin y el checkout, con el stock real: lo cargado menos lo vendido (lib/data/makeup-stock.ts).
 * Lo guardado se normaliza (datos viejos o rotos).
 */
export async function getAllMakeup(): Promise<MakeupProduct[]> {
  const [base, sold] = await Promise.all([getMakeupBase(), read("makeup_sold")]);
  return applyMakeupSold(base, sold && typeof sold === "object" ? sold : {});
}

/** Maquillaje visible en la tienda (los agotados también: se muestran como "Agotado"). Sin datos internos. */
export async function getMakeup(): Promise<MakeupProduct[]> {
  return (await getAllMakeup()).filter((m) => m.active).map(toPublicMakeup);
}

export async function getFeaturedMakeup(limit = 6): Promise<MakeupProduct[]> {
  const all = await getMakeup();
  const featured = all.filter((m) => m.featured);
  // los combos van primero: son lo que más conviene mostrar
  const list = featured.length ? featured : all;
  return [...list.filter((m) => m.category === "combos"), ...list.filter((m) => m.category !== "combos")].slice(0, limit);
}
