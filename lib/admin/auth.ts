import "server-only";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export type AdminSession = { email: string; name?: string; dev?: boolean };

/**
 * Sesión admin. Con Supabase: usuario logueado cuyo email está en ADMIN_EMAILS o
 * en la tabla admin_users. Sin Supabase y fuera de producción: modo desarrollo.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!supabaseConfigured()) {
    if (process.env.NODE_ENV !== "production") return { email: "dev@local", name: "Dev", dev: true };
    return null;
  }
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  if (!(await isAllowed(email))) return null;
  return { email, name: (user.user_metadata?.name as string | undefined) ?? undefined };
}

export async function isAllowed(email: string): Promise<boolean> {
  const envList = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (envList.includes(email)) return true;
  const db = getDb();
  if (!db) return false;
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return Boolean(row);
}

export async function requireAdmin(): Promise<AdminSession> {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  return s;
}
