import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

/** Tope por consulta: si la base no responde en este tiempo, se corta y se rearma la conexión. */
const QUERY_TIMEOUT_MS = 15_000;

const globalForDb = globalThis as unknown as { __bfDb?: Db | null; __bfSql?: postgres.Sql };

/**
 * En Vercel las conexiones al pooler de Supabase pueden quedar colgadas (la función se congela a mitad de una
 * consulta y el socket queda muerto sin que nadie se entere). postgres.js no tiene timeout por consulta, así que
 * una conexión trabada dejaba esperando para siempre a todas las consultas que caían en ella (el admin no cargaba
 * nunca). Acá cada consulta tiene un tope: si se pasa, se cancela, se tira el pool entero y la próxima arranca limpia.
 */
function withQueryTimeout(sql: postgres.Sql) {
  const rawUnsafe = sql.unsafe.bind(sql);
  sql.unsafe = ((query: string, params?: unknown[], options?: postgres.UnsafeQueryOptions) => {
    const q = rawUnsafe(query, params as postgres.ParameterOrJSON<never>[], options);
    const rawThen = q.then.bind(q);
    // drizzle hace `await sql.unsafe(...).values()`; values() devuelve la misma consulta, así que basta con envolver then
    q.then = ((onFulfilled, onRejected) =>
      new Promise<Awaited<typeof q>>((resolve, reject) => {
        const timer = setTimeout(() => {
          console.error(`[db] la consulta tardó más de ${QUERY_TIMEOUT_MS / 1000}s, se reinicia la conexión:`, query.slice(0, 120));
          q.cancel();
          resetDb(sql);
          reject(new Error("La base de datos no respondió a tiempo. Probá de nuevo."));
        }, QUERY_TIMEOUT_MS);
        rawThen(
          (v) => (clearTimeout(timer), resolve(v)),
          (e) => (clearTimeout(timer), reject(e)),
        );
      }).then(onFulfilled, onRejected)) as typeof q.then;
    return q;
  }) as typeof sql.unsafe;
  return sql;
}

function resetDb(sql: postgres.Sql) {
  if (globalForDb.__bfSql !== sql) return; // ya se rearmó
  globalForDb.__bfDb = undefined;
  globalForDb.__bfSql = undefined;
  // deja terminar unos segundos lo que está en curso en esa conexión antes de cerrarla
  sql.end({ timeout: 5 }).catch(() => {});
}

/** Devuelve la DB si hay DATABASE_URL; si no, null y la app usa datos locales. */
export function getDb(): Db | null {
  if (globalForDb.__bfDb !== undefined) return globalForDb.__bfDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    globalForDb.__bfDb = null;
    return null;
  }
  const client = withQueryTimeout(
    postgres(url, {
      prepare: false, // el transaction pooler no soporta prepared statements
      // sin pipelining: postgres.js manda hasta 100 consultas seguidas por la misma conexión y el pooler de Supabase en
      // modo transacción pierde respuestas así (consultas colgadas, páginas con error 500). Una por conexión a la vez.
      max_pipeline: 0,
      max: 5,
      connect_timeout: 10,
      // cerrar las conexiones ociosas antes de que el pooler o un congelamiento de la función las deje muertas
      idle_timeout: 20,
      max_lifetime: 60 * 5,
    } as postgres.Options<Record<string, never>>), // max_pipeline existe en postgres.js pero no está en sus tipos
  );
  globalForDb.__bfSql = client;
  globalForDb.__bfDb = drizzle(client, { schema });
  return globalForDb.__bfDb;
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
