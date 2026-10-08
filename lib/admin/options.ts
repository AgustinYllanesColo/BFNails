import "server-only";
import { eq } from "drizzle-orm";
import { requireDb } from "./db";
import { builderOptions, settings } from "@/lib/db/schema";

export async function updateOption(id: string, patch: { delta?: number; complexity?: number; active?: boolean; label?: string }) {
  const db = requireDb();
  await db.update(builderOptions).set(patch).where(eq(builderOptions.id, id));
}

export async function setBasePrice(value: number) {
  const db = requireDb();
  await db
    .insert(settings)
    .values({ key: "basePrice", value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function listAllOptions() {
  const db = requireDb();
  return db.select().from(builderOptions).orderBy(builderOptions.kind, builderOptions.sort);
}
