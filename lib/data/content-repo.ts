import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { promoRules, type PromoRules } from "@/lib/promos";
import { getDesigns } from "./repo";
import { inStock } from "./catalog";
import { DEFAULT_CHARMS, DEFAULT_KIT, DEFAULT_PROMOS, promoIsLive, type Charm, type Kit, type Promo } from "./content";

type ContentMap = { promos: Promo[]; charms: Charm[]; kit: Kit };
const DEFAULTS: ContentMap = { promos: DEFAULT_PROMOS, charms: DEFAULT_CHARMS, kit: DEFAULT_KIT };

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

/** Lo que el carrito y el checkout necesitan para calcular las promos: cuáles valen y qué sets están en stock. */
export async function getCartPromos(): Promise<{ rules: PromoRules; stockSlugs: string[] }> {
  const [promos, designs] = await Promise.all([getLivePromos(), getDesigns()]);
  return { rules: promoRules(promos), stockSlugs: designs.filter(inStock).map((d) => d.slug) };
}
