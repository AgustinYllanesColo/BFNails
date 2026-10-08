import "server-only";
import { getDb } from "@/lib/db/client";
import { builderOptions, settings } from "@/lib/db/schema";
import { DEFAULT_BUILDER_CONFIG, type BuilderConfig } from "@/lib/pricing";
import { DEFAULT_SHIPPING_TABLE, type ShippingTable } from "@/lib/shipping/table";
import { eq } from "drizzle-orm";

export type SiteSettings = {
  basePrice: number;
  hourlyRate: number; // valor hora de Brenda, para costos
  targetMargin: number; // 0..1
  shipping: ShippingTable;
  whatsapp: string;
  transferAlias: string;
  transferHolder: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  basePrice: DEFAULT_BUILDER_CONFIG.basePrice,
  hourlyRate: 6000,
  targetMargin: 0.55,
  shipping: DEFAULT_SHIPPING_TABLE,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491100000000",
  transferAlias: process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "bfnails.studio",
  transferHolder: process.env.NEXT_PUBLIC_TRANSFER_HOLDER ?? "Brenda",
};

export async function getSettings(): Promise<SiteSettings> {
  const db = getDb();
  if (!db) return DEFAULT_SETTINGS;
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<SiteSettings>;
  return { ...DEFAULT_SETTINGS, ...map };
}

export async function setSetting<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
  const db = getDb();
  if (!db) throw new Error("Sin base de datos");
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function getBuilderConfig(): Promise<BuilderConfig> {
  const db = getDb();
  if (!db) return DEFAULT_BUILDER_CONFIG;
  const [rows, s] = await Promise.all([
    db.select().from(builderOptions).where(eq(builderOptions.active, true)).orderBy(builderOptions.sort),
    getSettings(),
  ]);
  if (rows.length === 0) return { ...DEFAULT_BUILDER_CONFIG, basePrice: s.basePrice };
  const of = (kind: string) => rows.filter((r) => r.kind === kind);
  return {
    basePrice: s.basePrice,
    shapes: of("shape").map((r) => ({ id: r.id as BuilderConfig["shapes"][number]["id"], label: r.label, delta: r.delta, complexity: r.complexity })),
    lengths: of("length").map((r) => ({ id: r.id as BuilderConfig["lengths"][number]["id"], label: r.label, delta: r.delta, complexity: r.complexity })),
    finishes: of("finish").map((r) => ({ id: r.id as BuilderConfig["finishes"][number]["id"], label: r.label, delta: r.delta, complexity: r.complexity })),
    bases: of("base").map((r) => ({ id: r.id, label: r.label, delta: r.delta, hex: r.hex ?? "#e8c4b0" })),
    extras: of("extra").map((r) => ({ id: r.id, label: r.label, delta: r.delta, complexity: r.complexity, group: r.group ?? "Otros", description: r.description ?? undefined })),
    tiers: DEFAULT_BUILDER_CONFIG.tiers,
  };
}
