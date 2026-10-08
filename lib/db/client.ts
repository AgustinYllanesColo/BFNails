import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __bfDb?: Db | null };

/** Devuelve la DB si hay DATABASE_URL; si no, null y la app usa datos locales. */
export function getDb(): Db | null {
  if (globalForDb.__bfDb !== undefined) return globalForDb.__bfDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    globalForDb.__bfDb = null;
    return null;
  }
  const client = postgres(url, { prepare: false, max: 5 });
  globalForDb.__bfDb = drizzle(client, { schema });
  return globalForDb.__bfDb;
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
