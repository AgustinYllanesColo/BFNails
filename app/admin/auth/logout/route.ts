import { NextResponse } from "next/server";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";
import { ADMIN_COOKIE } from "@/lib/admin/password";

export async function POST(req: Request) {
  if (supabaseConfigured()) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  const res = NextResponse.redirect(new URL("/admin/login", new URL(req.url).origin), { status: 303 });
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
