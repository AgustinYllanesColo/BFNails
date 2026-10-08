import "server-only";
import { getDb, type Db } from "@/lib/db/client";

export class NoDbError extends Error {
  constructor() {
    super("Esta acción necesita la base de datos. Configurá DATABASE_URL (Supabase).");
  }
}

export function requireDb(): Db {
  const db = getDb();
  if (!db) throw new NoDbError();
  return db;
}
